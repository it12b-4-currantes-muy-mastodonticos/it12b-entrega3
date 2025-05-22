from .CollectorBase import CollectorBase

class CollectPullRequests(CollectorBase):
    def execute(self, data: dict, metrics: dict, members) -> dict:
        pull_requests = data['pull_requests']
        total = 0
        merged = 0
        closed = 0
        not_merged_by_author = 0
        created_PRs_per_member = {member: 0 for member in members}
        merged_PRs_per_member = {member: 0 for member in members}
        for _,pull_request in pull_requests.items():
            total += 1
            created_PRs_per_member[pull_request["author"]] += 1
            if pull_request['merged'] != False: 
                merged += 1
                merged_PRs_per_member[pull_request["merged_by"]] += 1
                if pull_request["author"] != pull_request["merged_by"]:
                    not_merged_by_author +=1
            elif pull_request['state'] == 'CLOSED': # Quan merged, state es 'closed'
                closed += 1
        metrics['pull_requests'] = {
            'created' : created_PRs_per_member,
            'merged_per_member' : merged_PRs_per_member,
            'merged': merged,
            'not_merged_by_author': not_merged_by_author,
            'closed': closed,
            'total': total
        }
        return metrics