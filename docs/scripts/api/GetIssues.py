from .APInterface import APInterface
import requests
class GetIssues(APInterface):
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        url = "https://api.github.com/graphql"
        cursor = None
        issues = {}
        while True:
            query = """
            {
                repository(owner: "%s", name: "%s") {
                    issues(first: 100%s) {
                        nodes {
                            id
                            state
                            assignees(first: 1) {
                                nodes {
                                    login
                                }
                            }
                            closedByPullRequestsReferences(first: 1) {
                                    totalCount
                                    nodes {
                                        author {
                                            login
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
            """ % (owner_name, repo_name,f', after: "{cursor}"' if cursor else "")

            response = requests.post(url, json={'query': query}, headers=headers)
            if response.status_code != 200:
                raise  requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")
            data_graphql = response.json()
            if 'data' in data_graphql:
                issues_data = data_graphql['data']['repository']['issues']['nodes']
                page_info = data_graphql['data']['repository']['issues']['pageInfo']
                for issue in issues_data:
                    issue_id = issue['id']
                    state =  issue["state"]
                    assignees = issue['assignees']['nodes']
                    assignee = assignees[0]['login'] if assignees else None
                    has_pr = issue['closedByPullRequestsReferences']['totalCount'] > 0
                    pr_author = issue['closedByPullRequestsReferences']['nodes'][0]['author']['login'] if has_pr else None
                    pr_author_is_assignee = pr_author == assignee if has_pr else None
                    issues[issue_id] = {
                        "state": state,
                        "assignee": assignee,
                        "has_pull_request": has_pr,
                        "pr_author_is_assignee": pr_author_is_assignee
                    }
                if page_info['hasNextPage']:
                    cursor = page_info['endCursor']
                else:
                    break
            else:
                break
        if "issues" in data:
            data["issues"].update(issues)
        else:
            data["issues"] = issues
        return data