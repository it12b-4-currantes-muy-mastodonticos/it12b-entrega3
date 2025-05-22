import pkgutil
import importlib


for _, module_name, _ in pkgutil.iter_modules(__path__):
    module = importlib.import_module(f"{__name__}.{module_name}")

    for attribute_name in dir(module):  
        attribute = getattr(module, attribute_name)

        if isinstance(attribute, type) and attribute_name.startswith("Get"):
            globals()[attribute_name] = attribute
