from .APInterface import APInterface
import requests
import concurrent.futures
from datetime import datetime

class GetCommits(APInterface):
    def get_branches(self,headers,repo_name,owner_name):
        url = f"https://api.github.com/repos/{owner_name}/{repo_name}/branches"
        response = requests.get(url, headers=headers)
        return [branch['name'] for branch in response.json() if response.status_code == 200]
    
    def query_graphql(self,owner_name, repo_name, branch_name, header,data):
        url = "https://api.github.com/graphql"
        cursor = None 
        while True:
            query = """
            {
            repository(owner: "%s", name: "%s") {
                ref(qualifiedName: "refs/heads/%s") {
                target {
                    ... on Commit {
                    history(first: 100%s) {
                        edges {
                            node {
                                oid  
                                author {
                                    user {
                                        login
                                    } 
                                }
                                additions  
                                deletions
                                committedDate
                                parents(first: 1) {
                                    totalCount
                                }
                            }
                            }
                            pageInfo {
                            hasNextPage
                            endCursor
                            }
                        }
                    }
                }
                }
            }
            }
                """ % (owner_name, repo_name, branch_name, f', after: "{cursor}"' if cursor else "")            
            
            response = requests.post(url, json={'query': query}, headers=header)
            if response.status_code != 200:
                raise  requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")
            data_graphql = response.json()

            if 'data' in data_graphql:
                commits_data_graphql = data_graphql['data']['repository']['ref']['target']['history']['edges']
                page_info = data_graphql['data']['repository']['ref']['target']['history']['pageInfo']
                
                for commit_data in commits_data_graphql:
                    commit = commit_data['node']
                    sha = commit['oid']
                    autor = commit['author']['user']['login']
                    additions = commit['additions']
                    deletions = commit['deletions']
                    date =  datetime.strptime(commit['committedDate'], "%Y-%m-%dT%H:%M:%SZ").strftime("%Y-%m-%d")
                    modified_lines = additions + deletions
                    if sha not in data:
                        data[sha] = {
                            "author": autor,
                            "additions": additions,
                            "deletions": deletions,
                            "modified": modified_lines,
                            "date": date,
                            "merge": True if commit['parents']['totalCount'] > 1 else False
                        }
                if page_info['hasNextPage']:
                    cursor = page_info['endCursor']
                else:
                    break
            else:
                break
        return data
    
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        branches = self.get_branches(headers,repo_name,owner_name)
        commits = {}
        if self.par:
            def process_branch(branch):
                return self.query_graphql(owner_name, repo_name, branch, headers, {})

            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                results = list(executor.map(process_branch, branches))
            for result in results:
                commits.update(result)
        else :
            for branch in branches:
                commits.update(self.query_graphql(owner_name, repo_name, branch, headers, {}))
                
        if "commits" in data:
            data["commits"].update(commits)
        else:
            data["commits"] = commits
        return data
