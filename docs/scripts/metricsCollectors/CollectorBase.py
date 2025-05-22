from abc import ABC, abstractmethod

class CollectorBase(ABC):
    @abstractmethod
    def execute(self, data: dict, metrics: dict, members) -> dict:
        pass
