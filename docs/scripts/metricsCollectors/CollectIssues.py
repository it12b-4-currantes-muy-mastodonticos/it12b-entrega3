from .CollectorBase import CollectorBase

class CollectIssues(CollectorBase):
    def execute(self, data: dict, metrics: dict, members) -> dict:
        issues = data['issues']
        assigned_issues_per_member = {member: 0 for member in members}
        closed_assigned_issues_per_member = {member: 0 for member in members}
        non_assigned = 0
        have_pr = 0
        assignee_is_pr_author = 0
        total = 0
        total_closed = 0
        for _,issue in issues.items():
            if issue['state'] == 'CLOSED':
                total_closed += 1
            if issue['assignee'] != None and issue['assignee'] in members:
                assigned_issues_per_member[issue['assignee']] +=1
                if issue['state'] == 'CLOSED':
                    closed_assigned_issues_per_member[issue['assignee']] += 1
                    if issue["has_pull_request"] == True : 
                        have_pr += 1
                        if issue["pr_author_is_assignee"] == True:
                            assignee_is_pr_author += 1
            else:
                non_assigned += 1
            total += 1
        metrics['issues']= {'assigned': assigned_issues_per_member
        }
        metrics['issues']['assigned']['non_assigned'] = non_assigned
        metrics['issues']['closed'] = closed_assigned_issues_per_member
        metrics['issues']['have_pull_request'] = have_pr
        metrics['issues']['assignee_is_pr_author'] = assignee_is_pr_author
        metrics['issues']['total_closed'] = total_closed
        metrics['issues']['total'] = total
        return metrics
         