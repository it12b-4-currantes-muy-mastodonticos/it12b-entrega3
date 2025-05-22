from .APInterface import APInterface
import requests

class GetPullRequests(APInterface):
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        url = "https://api.github.com/graphql"
        cursor = None
        pull_requests = {}
        while True:
            query = """
            {
            repository(owner: "%s", name: "%s") {
                pullRequests(first: 100%s) {
                nodes {
                    id
                    author {
                        login
                    }
                    state
                    merged
                    mergedBy {
                    login
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
                }
            }
            }
            """ % (owner_name, repo_name, f', after: "{cursor}"' if cursor else "")

            response = requests.post(url, json={'query': query}, headers=headers)
            if response.status_code != 200:
                raise  requests.RequestException(f"Error al fer la trucada a {self.__class__.__name__}: {response.status_code}")
            data_graphql = response.json()
            if 'data' in data_graphql:
                pr_data = data_graphql['data']['repository']['pullRequests']['nodes']
                page_info = data_graphql['data']['repository']['pullRequests']['pageInfo']
                for pr in pr_data:
                    pr_id = pr['id']
                    author = pr["author"]["login"]
                    state = pr['state']
                    merged = pr['merged']
                    merged_by = pr['mergedBy']['login'] if merged else None

                    pull_requests[pr_id] = {
                        "state": state,
                        "author": author,
                        "merged": merged,
                        "merged_by": merged_by
                    }
                if page_info['hasNextPage']:
                    cursor = page_info['endCursor']
                else:
                    break
            else:
                break

        if "pull_requests" in data:
            data["pull_requests"].update(pull_requests)
        else:
            data["pull_requests"] = pull_requests
        return data