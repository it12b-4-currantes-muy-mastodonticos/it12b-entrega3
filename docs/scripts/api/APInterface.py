from abc import ABC, abstractmethod

class APInterface(ABC):
    def __init__(self, par=False):
        self.par = par

    @abstractmethod
    def execute(self, owner_name, repo_name, headers, project_number, data: dict) -> dict:
        pass