from .CollectorBase import CollectorBase

class CollectAvatar(CollectorBase):
    def execute(self, data: dict, metrics: dict, members) -> dict:
        metrics["avatars"] =  data['members_images']
        return metrics
         