from .APInterface import APInterface
import requests

class GetProjects(APInterface):
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        if project_number < 0: 
            data["project"] = {}
            return data
        url = "https://api.github.com/graphql"
        cursor = None
        project = {}
        while True:
            query = """
            {
                organization(login: "%s") {
                    projectV2(number: %d) {
                        title
                        items(first: 100%s) {
                            nodes {
                                content {
                                    __typename
                                    ... on Issue {
                                        title
                                        id
                                        assignees(first: 1) {
                                            nodes {
                                                login
                                            }
                                        }
                                    }
                                    ... on DraftIssue {
                                        title
                                        id
                                        assignees(first: 1) {
                                            nodes {
                                                login
                                            }
                                        }
                                    }
                                }
                                fieldValues(first: 10) {
                                    nodes {
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            field {
                                                ... on ProjectV2FieldCommon {
                                                    name
                                                }
                                            }
                                            name
                                        }
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
            """ % (owner_name, project_number, f', after: "{cursor}"' if cursor else "")


            response = requests.post(url, json={'query': query}, headers=headers)
            if response.status_code != 200:
                raise requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")
            
            data_graphql = response.json()

            if 'data' in data_graphql:
                items_data = data_graphql['data']['organization']['projectV2']['items']['nodes']
                page_info = data_graphql['data']['organization']['projectV2']['items']['pageInfo']

                for item in items_data:
                    id = None
                    title = None
                    assignees = None
                    status = None
                    item_type = None

                    if 'content' in item:
                        content = item['content']
                        if 'id' in content:
                            id = content['id']
                        if 'title' in content:
                            title = content['title']
                        if 'assignees' in content:
                            assignees = content['assignees']['nodes']
                            assignee = assignees[0]['login'] if assignees else None

                        for field_value in item['fieldValues']['nodes']:
                            if 'field' in field_value and field_value['field']['name'] == "Status":
                                status = field_value['name']
                    if id: 
                        project[id] = {
                            "title": title,
                            "assignee": assignee,
                            "status": status,
                            "item_type": item_type
                        }
                if page_info['hasNextPage']:
                    cursor = page_info['endCursor']
                else:
                    break
            else:
                break

        if "project" in data:
            data["project"].update(project)
        else:
            data["project"] = project
        return data
