# MetricsApp

## Taula de continguts
- [Configuració per a una organització](#configuració-per-a-una-organització)
- [Configuració per a un repositori](#configuració-per-a-un-repositori)

Aquesta eina serveix per a recollir mètriques dels repositoris d'una organització o d'un repositori concret. A continuació s'expliquen els passos per a configurar-la, tant per a una organització com per a un repositori concret.

## Configuració per a una organització

Aquests passos cal que els faci el propietari de l'organització de GitHub de la que es vol recollir les mètriques.

El primer que cal fer és crear un repositori públic nou a l'organització a partir d'aquest repositori, amb el botó *Use this template* i l'opció *Create a new repository* a dalt a la dreta d'aquest repositori:

![Captura de pantalla 2025-04-29 115237](https://github.com/user-attachments/assets/7be8d29b-8b7a-4bcd-8325-ebf831a377a4)

Al crear-lo, marqueu la casella *Include all branches*, que el *Owner* sigui la vostra organització i que sigui públic. En el meu cas, la meva organització és ProvaMetriques:

![Captura de pantalla 2025-04-29 115443](https://github.com/user-attachments/assets/96c25aea-9e39-452e-9302-72c058276c13)

Un cop creat s'executarà un cop el GitHub actions i fallarà, ja que encara no està configurat, per tant, és normal i podeu ignorar-ho de moment.

Per continuar, cal anar a la branca **gh-pages**, o si no s'ha marcat la casella *Include all branches* crear-la, obrir docs/config.json i posar a *excluded_repos* el nom del repo que acabeu de crear (només el nom). És molt important fer-ho a la branca **gh-pages**, si ho feu a **main** o **master** no funcionarà. També si teniu com a membres de l'organització professors i bots, heu de posar els seus noms d'usuari a *excluded_members*. Després us heu d'assegurar que *metrics_scope* i *members* posi org (ja hauria d'estar configurat així per defecte). Si hi ha alguna cosa que no utilitzeu (com issues p.ex), elimineu de *features* el nom d'aquest. Un cop heu acabat feu commit a la branca **gh-pages**.

En la següent imatge he posat un exemple, on el meu repositori per a les mètriques es diu Metrics i hi ha un bot i un professor:

![Captura de pantalla 2025-04-30 000026](https://github.com/user-attachments/assets/03ce013e-89f7-4939-acae-a35d9da83745)

Després heu d'anar a configuració, i dintre de la categoria *Code and automation*, anar a *Pages*, i un cop a *Pages*, deixeu Source a *Deploy from a branch*, i a branch poseu la branca **gh-pages** i canvieu la carpeta de /(root) a /docs i cliqueu save.

![Captura de pantalla 2025-04-29 120343](https://github.com/user-attachments/assets/488c1add-1fed-4c78-b54d-9d7d8ff9fc3d)

Un cop fet això podeu tornar a la pàgina de *Code* i a la secció *About* a la dreta de la pantalla, si cliqueu per configurar a l'engranatge, ressaltat en blau a la imatge que hi ha a continuació, hi ha un apartat que es diu website, i una checkbox *Use your GitHub Pages website*, marqueu-la i feu Save Changes. Podeu copiar aquest link i posar-lo al *About* de tots els repositoris de la vostra organització. Si aneu ara a la pàgina, us dirà que encara no hi ha metrics.json, però només funcionarà si continueu amb la configuració.

![Captura de pantalla 2025-04-29 120228](https://github.com/user-attachments/assets/96cd28b6-9590-4ae3-8fbf-0cc550fdf4ad)


![Captura de pantalla 2025-04-29 120254](https://github.com/user-attachments/assets/d379cfbd-12fe-43e1-8362-8f145d549e07)

L'últim pas és anar a la configuració de l'usuari que és el propietari de l'organització i anar a *Developer setting* (a baix de tot).

![Captura de pantalla 2025-04-29 120627](https://github.com/user-attachments/assets/46ec09f1-5d48-4141-ba7c-99daac57adef)

Un cop a *Developer setting*, heu d'anar *Personal access tokens* i *Fine-graiend tokens*, i donar-li a *Generate new token*. Si no heu creat mai cap, es veurà com la primera captura, si ja heu creat algun, es veurà com a la segona.

![Captura de pantalla 2025-04-29 191409](https://github.com/user-attachments/assets/bf7b449f-3497-4271-a9b1-970f472cd2a4)


![Captura de pantalla 2025-04-29 120713](https://github.com/user-attachments/assets/775619a8-d5e1-4516-a74e-a6e8c273987a)


Poseu-li el nom que vulgueu (metrics, p. ex). Heu de canviar el *Resource Owner* del token a l'organització, i això només ho pot fer el propietari de l'organització, per això és important que ho faci aquest. També poseu una *Expiration date* que duri fins al final del projecte, si per exemple és un projecte que entregueu el 31 de maig, podeu posar una setmana més.

A *Repository acces* poseu *All repositories*.

![Captura de pantalla 2025-04-29 120819](https://github.com/user-attachments/assets/e480fde6-742c-42cd-b50a-8795dc3301e8)


A *Repository permissions* heu de seleccionar: 

-Actions: read and write

-Contents: read-only

-Issues: read-only

-Pull requests: read-only

A *Organization permissions* heu de seleccionar:

-Members: read-only

Si ho heu seleccionat tot bé, quan li doneu a Generate token, us sortiran els permisos següents:

![Captura de pantalla 2025-04-29 120918](https://github.com/user-attachments/assets/6f74f981-95da-4964-9e4d-74568505bffb)

![Captura de pantalla 2025-04-29 120922](https://github.com/user-attachments/assets/4b60b281-0d0a-4c16-9204-16ff941cd3d2)


Un cop generat, copieu el token temporalment a algun lloc, com a un arxiu de text, perquè un cop sortiu de la pàgina ja no podreu veure'l més.

Ara heu d'anar al repositori que heu creat, configuració i a l'apartat *Security*, aneu a *Secrets and variables*, i seleccioneu *Actions*, i veureu que hi ha una pestanya *Secrets* ja seleccionada.

![Captura de pantalla 2025-04-29 121144](https://github.com/user-attachments/assets/c65fba33-d412-4a4a-ab4d-16ded4b3a52a)


Heu de crear un nou *Secret* amb el botó verd *New repository secret*. És molt important que sigui a *Secrets* i no *variables*, perquè no funcionarà i a més a més tothom podria veure el token, que per seguretat ha de ser privat. A name, en aquest cas cal que li poseu de nom **ORG_TOKEN** perquè funcioni, i enganxeu el token que heu copiat abans a l'apartat Secret, i cliqueu *Add secret*. Encara no borreu l'arxiu amb el token copiat.

![Captura de pantalla 2025-04-29 121302](https://github.com/user-attachments/assets/53e568f3-4532-4bcf-99f7-c357bbfa3e7c)

Ara el repositori de mètriques ja està configurat del tot, però perquè reculli mètriques quan feu push, creeu pull requests, o modifiqueu issues a altres repositoris, cal que configureu a cada repositori una última cosa.

Per a cada repositori que volgueu recollir les metriques, cal seguir els pasos per afegir el token a cadascun d'ells, amb el mateix nom, **ORG_TOKEN**, i per últim, heu de copiar els arxius trigger_workflow.yml i remote_repo.json que són a la carpeta docs del repositori que acabeu de crear, poseu el nom del repositori amb el format **owner/name**, on owner és l'organització i name és el nom del repositori, i a cada un dels repositoris, important que sigui a la branca **main** o **master**, crear una carpeta .github, el punt davant és important, amb una altra a dins que es digui workflows, i a dins posar els dos arxius. Un cop fet això, ja està configurat tot el repositori. Un cop posat el token a tots els repositoris, ja podeu eliminar l'arxiu de text temporal amb el token. Aquest token es perdrà, però si us fa falta afegir un altre repositori, sempre en podeu crear un de nou amb els mateixos permisos.

Aquí hi ha l'exemple de remote_repo.json en un repositori diferent del de mètriques de la meva organització ProvaMetriques, on poso el nom del meu repositori de mètriques, que es diu Metrics:

![Captura de pantalla 2025-04-29 192217](https://github.com/user-attachments/assets/5687e074-2a24-4afe-8ee5-8495e6681fd0)

Ara ja està configurada l'eina, i no cal que feu res més. Podeu visitar sempre que vulgueu la pàgina web, que sempre tindrà la informació més actualitzada.

## Configuració per a un repositori

S'ha de configurar de dues maneres diferents depenent de si es fa un repositori nou o un ja existent. Per al repositori nou només cal crear un repositori públic nou a partir d'aquest repositori, amb el botó *Use this template* i l'opció *Create a new repository* a dalt a la dreta d'aquest repositori:

![Captura de pantalla 2025-04-29 115237](https://github.com/user-attachments/assets/7be8d29b-8b7a-4bcd-8325-ebf831a377a4)

Al crear-lo, marqueu la casella *Include all branches*.

En el cas d'un existent, heu de copiar les carpetes d'aquest al repositori del qual voleu les mètriques. Un cop siguin a la branca **main** o **master** del repositori, creeu una branca que es digui **gh-pages**. Si el repo és privat, cal que sigui públic perquè es pugui utilitzar GitHub Pages.

Un cop creat el repo o la branca, cal anar a la branca **gh-pages**, anar a docs/config.json i canviar a *metrics_scope* i *members* a repo.

Després heu d'anar a configuració, i dintre de la categoria *Code and automation*, anar a *Pages*, i un cop a *Pages*, deixeu Source a *Deploy from a branch*, i a branch poseu la branca **gh-pages** i canvieu la carpeta de /(root) a /docs i cliqueu save.

![Captura de pantalla 2025-04-29 120343](https://github.com/user-attachments/assets/488c1add-1fed-4c78-b54d-9d7d8ff9fc3d)

Un cop fet això podeu tornar a la pàgina de *Code* i a la secció *About* a la dreta de la pantalla, si cliqueu per configurar a l'engranatge, ressaltat en blau a la imatge que hi ha a continuació, hi ha un apartat que es diu website, i una checkbox *Use your GitHub Pages website*, marqueu-la i feu Save Changes. Si aneu ara a la pàgina, us dirà que encara no hi ha metrics.json, podeu fer un primer commit perquè s'executi per primer cop el GitHub Actions i es reculli les mètriques per primer cop.

![Captura de pantalla 2025-04-29 120228](https://github.com/user-attachments/assets/96cd28b6-9590-4ae3-8fbf-0cc550fdf4ad)

![Captura de pantalla 2025-04-29 120254](https://github.com/user-attachments/assets/d379cfbd-12fe-43e1-8362-8f145d549e07)

Un cop fet això l'eina ja estarà configurada.
