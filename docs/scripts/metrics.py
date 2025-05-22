import os
import sys
import json
from datetime import datetime,timezone,timedelta
import api
import metricsCollectors
import concurrent.futures
from api import GetCollaborators,GetMembers,GetOrgRepos

def load_env_local(path):
    with open(path, 'r') as f:
        variables = json.load(f)
        for key, value in variables.items():
            os.environ[key] = value

env_path = "env.json"
if os.path.exists(env_path):
    load_env_local(env_path)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN").strip()
ORG_TOKEN = os.getenv("ORG_TOKEN").strip()
REPO = os.getenv("GITHUB_REPOSITORY")
REPO_OWNER,REPO_NAME = os.getenv("GITHUB_REPOSITORY").split("/")
PARALLELISM = True
HEADERS_REPO = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Content-Type": "application/json"
        }
HEADERS_ORG = {
    "Authorization": f"token {ORG_TOKEN}",
    "Content-Type": "application/json"
    }
required_fields = {
    "metrics_scope": str,
    "members": str,
    "excluded_members": list,
    "excluded_repos":list
}

valid_metrics_scope = ["org","repo"]
valid_members = ["org","repo","both"]

class ConfigError(Exception):
    pass

def validar_config(config):
    for field,data_type in required_fields.items():
        if field not in config:
            raise ConfigError(f"Error: Falta el camp obligatori '{field}' a config.json")
        if not isinstance(config[field],data_type):
            raise ConfigError(f"Error: El camp obligatori '{field}' de config.json ha de ser de tipus {data_type.__name__}")

    if config["metrics_scope"] not in valid_metrics_scope:
        raise ConfigError(f"Error: El camp obligatori 'metrics_scope' de config.json no té un valor vàlid. Valors vàlids: {valid_metrics_scope}")
    if config["members"] not in valid_members:
        raise ConfigError(f"Error: El camp obligatori 'members' de config.json no té un valor vàlid. Valors vàlids: {valid_members}")
    
def make_api_calls(repo,instances,project_number,headers):
    local_data = {}
    if not PARALLELISM:
        for instance in instances:
            local_data = instance.execute(REPO_OWNER,repo,headers,project_number,local_data)
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(instance.execute, REPO_OWNER, repo, headers, project_number, local_data) for instance in instances]

            for future in concurrent.futures.as_completed(futures):
                local_data = future.result()
    return local_data

def combinar_resultats(result,data): 
    for key, value in result.items():
        if key in data and isinstance(data[key], dict) and isinstance(value, dict):
            data[key].update(value)
        elif key in data and isinstance(data[key], list) and isinstance(value, list):
            data[key].extend(value)
        else:
            data[key] = value  
    return data

def get_metrics():
    config_path = "../config.json"
    if os.path.exists(config_path):
        with open(config_path,'r') as f:
            config = json.load(f)
    else:
        raise FileNotFoundError("Arxiu config.json no trobat.")
    validar_config(config)
    metrics_path = "../metrics.json"
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as j:
                metrics = json.load(j)
        except (json.JSONDecodeError, ValueError):
            metrics = {}
    else:
        metrics = {}
    data = {}
    instances = []
    project_number = -1
    if config['metrics_scope'] == "org":
        instancesConfig = []
        instancesConfig.append(GetOrgRepos())
        instancesConfig.append(GetMembers())
        data = GetOrgRepos().execute(REPO_OWNER,"",HEADERS_ORG,"",data)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(instance.execute,REPO_OWNER,"",HEADERS_ORG,"",data) for instance in instancesConfig]
            for future in concurrent.futures.as_completed(futures):
                data.update(future.result())  
        if(config["members"] == "both"): instances.append(GetCollaborators())
        repos = [m for m in data['repos'] if m not in config['excluded_repos']]
        HEADERS = HEADERS_ORG
    else:
        if config["members"] == "repo": 
            instances.append(GetCollaborators())
            HEADERS = HEADERS_REPO
        elif config["members"] == "org": 
            instances.append(GetMembers())
            HEADERS = HEADERS_ORG
        elif config["members"] == "both":
            instances.append(GetMembers())
            instances.append(GetCollaborators())
            HEADERS = HEADERS_ORG
        repos = [REPO_NAME]

    for class_name, class_obj in api.__dict__.items():
        if isinstance(class_obj, type) and class_name.startswith("Get") and class_name not in ["GetMembers","GetCollaborators","GetOrgRepos"]:
            instances.append(class_obj(PARALLELISM))
    if not PARALLELISM:
        for repo in repos:
            result = make_api_calls(repo,instances,project_number,HEADERS) 
            combinar_resultats(result,data)    
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(make_api_calls, repo, instances,project_number, HEADERS) for repo in repos]

            for future in concurrent.futures.as_completed(futures):
                combinar_resultats(future.result(),data)
    members = data['members']  
    members = [m for m in members if m not in config['excluded_members']]
    instances = []
    for class_name, class_obj in metricsCollectors.__dict__.items():
        if isinstance(class_obj, type) and class_name.startswith('Collect') and not bool(getattr(class_obj, "__abstractmethods__", False)):
            instances.append(class_obj())
    for instance in instances:
       metrics = instance.execute(data,metrics,members)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

def daily_metrics():
    metrics_path = "../metrics.json"
    historic_metrics_path = "../historic_metrics.json"
    exists_metrics = True
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, "r") as j:
                metrics = json.load(j)
        except (json.JSONDecodeError, ValueError):
            exists_metrics = False
    else:
        exists_metrics = False
    if not exists_metrics:
        get_metrics()
        with open(metrics_path, "r") as j:
            metrics = json.load(j)
    if os.path.exists(historic_metrics_path):
        try:
            with open(historic_metrics_path, "r") as j:
                historic = json.load(j)
        except (json.JSONDecodeError, ValueError):
            historic = {}
    else:
        historic = {}
    date = datetime.now(timezone.utc).date() - timedelta(days=1)
    metrics.pop("avatars",None)
    historic[date.strftime("%Y-%m-%d")] = metrics
    with open(historic_metrics_path, "w") as j:
        json.dump(historic,j,indent=4)

def main():
    daily_mode = False
    if len(sys.argv) > 1:
        if sys.argv[1] == "daily":
            daily_mode = True
    if daily_mode:
        daily_metrics()
    else: 
        get_metrics()

if __name__ == "__main__":
    main()