from .APInterface import APInterface
import requests

class GetMembers(APInterface):
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        url = f" https://api.github.com/orgs/{owner_name}/members"
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            raise  requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")
        members_data = response.json()
        data['members'] = [obj['login'] for obj in members_data]
        data['members_images'] = {obj['login']: obj['avatar_url'] for obj in members_data}
        return data