from .APInterface import APInterface
import requests

class GetOrgRepos(APInterface):
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        url = f"https://api.github.com/orgs/{owner_name}/repos"
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            raise  requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")

        repos_data = response.json()
        repos = []
        for repo_data in repos_data:
            repos.append(repo_data['name'])
        data['repos'] = repos
        return data