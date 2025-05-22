from .CollectorBase import CollectorBase

class CollectProject(CollectorBase):
    def execute(self, data: dict, metrics: dict, members) -> dict:
        draftIssues = data['project']
        assigned_draftIssue_per_member = {member: 0 for member in members}
        done_assigned_draftIssues_per_member = {member: 0 for member in members}
        in_progress_assigned_draftIssues_per_member = {member: 0 for member in members}
        non_assigned = 0
        total = 0
        total_done = 0
        total_in_progress = 0
        for _,draftIssue in draftIssues.items():
            total +=1
            if draftIssue['status'] == 'Done':
                total_done += 1
            elif draftIssue['status'] == 'In Progress':
                total_in_progress += 1
            if draftIssue['assignee'] != None and draftIssue['assignee'] in members:
                assigned_draftIssue_per_member[draftIssue['assignee']] +=1
                if draftIssue['status'] == 'Done':
                    done_assigned_draftIssues_per_member[draftIssue['assignee']] += 1
                elif draftIssue['status'] == 'In Progress':
                    in_progress_assigned_draftIssues_per_member[draftIssue['assignee']] +=1
            else:
                non_assigned += 1
        metrics['project']= {
            'assigned_per_member': assigned_draftIssue_per_member,
            'in_progress_per_member': in_progress_assigned_draftIssues_per_member,
            'done_per_member': done_assigned_draftIssues_per_member,
            'in_progress': total_in_progress,
            'done': total_done,
            'total': total
        }
        return metrics
         