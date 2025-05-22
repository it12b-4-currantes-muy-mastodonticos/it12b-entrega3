from .CollectorBase import CollectorBase
from datetime import datetime, timedelta,timezone

class CollectCommitsMetrics(CollectorBase):
    def execute(self, data: dict, metrics: dict, members) -> dict:
        commits = data['commits']
        commits_per_member = {member: 0 for member in members}
        modified_lines_per_member = {
                member: {
                    "additions": 0,
                    "deletions": 0,
                    "modified": 0
                }
            for member in members
            }
        streaks_per_member = {member: 0 for member in members}
        commit_dates = {member: [] for member in members}
        anonymous_commits = 0    
        total_commits = 0
        total_additions = 0
        total_deletions = 0
        total_modified = 0
        commit_merges = 0
        for _,commit in commits.items():
            if commit['merge']:
                commit_merges +=1
            elif commit['author'] in commits_per_member:
                commit_dates[commit['author']].append(datetime.strptime(commit['date']  , "%Y-%m-%d").date())
                commits_per_member[commit['author']] +=1
                modified_lines_per_member[commit['author']]['additions'] += commit['additions']
                total_additions += commit['additions'] 
                modified_lines_per_member[commit['author']]['deletions'] += commit['deletions']
                total_deletions += commit['deletions'] 
                modified_lines_per_member[commit['author']]['modified'] += commit['modified']
                total_modified += commit['modified']
                total_commits +=1
            elif commit['author'] != "github-actions[bot]":
                anonymous_commits += 1
                total_commits +=1
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        for member, dates in commit_dates.items():
            unique_dates = set(dates)  

            if today in unique_dates:
                streak = 1
                day = yesterday
                while day in unique_dates:
                    streak += 1
                    day -= timedelta(days=1)
            elif yesterday in unique_dates:
                streak = 1
                day = yesterday - timedelta(days=1)
                while day in unique_dates:
                    streak += 1
                    day -= timedelta(days=1)
            else:
                streak = 0
            streaks_per_member[member] = streak
        commits_per_member["anonymous"] = anonymous_commits
        commits_per_member["total"] = total_commits
        modified_lines_per_member["total"] = {
                    "additions": total_additions,
                    "deletions": total_deletions,
                    "modified": total_modified
                }
        metrics["commits"] = commits_per_member
        metrics["modified_lines"] = modified_lines_per_member
        metrics["commit_streak"] = streaks_per_member  
        metrics["commit_merges"] = commit_merges  
        for member, streak in streaks_per_member.items():
            if member not in metrics.get('longest_commit_streak_per_user', {}):
                metrics.setdefault('longest_commit_streak_per_user', {})[member] = streak
            else:
                metrics['longest_commit_streak_per_user'][member] = max(metrics['longest_commit_streak_per_user'][member], streak)
        return metrics