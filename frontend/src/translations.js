import { swahili } from './swahili.js'

// English keys also provide the fallback for messages returned by the server.
const rows = `
Items for sale|Ibintu bigurishwa|Articles à vendre
Not posted|Ntibiratangazwa|Non publié
No items for sale.|Nta bintu bigurishwa.|Aucun article à vendre.
Delete this account and its job cards, knowledge, spare parts, sale items, requests and chats? This cannot be undone.|Gusiba iyi konti n’amafishi y’akazi, ubumenyi, ibikoresho, ibintu bigurishwa, ubusabe n’ibiganiro byayo? Ntibishobora gusubizwa.|Supprimer ce compte et ses fiches, connaissances, pièces, articles, demandes et conversations ? Cette action est irréversible.
Delete this job card and its maintenance knowledge? This cannot be undone.|Gusiba iri fishi ry’akazi n’ubumenyi bujyanye na ryo? Ntibishobora gusubizwa.|Supprimer cette fiche et les connaissances associées ? Cette action est irréversible.
Delete this spare part, its public post and related requests? This cannot be undone.|Gusiba iki gikoresho, itangazo ryacyo n’ubusabe bujyanye na cyo? Ntibishobora gusubizwa.|Supprimer cette pièce, son annonce et les demandes associées ? Cette action est irréversible.
Delete this sale item and its public post? This cannot be undone.|Gusiba iki kintu kigurishwa n’itangazo ryacyo? Ntibishobora gusubizwa.|Supprimer cet article et son annonce ? Cette action est irréversible.
Language|Ururimi|Langue
Install app|Shyiramo porogaramu|Installer l’application
Price not provided|Igiciro nticyatanzwe|Prix non indiqué
View on homepage|Reba ku rupapuro rw’ibanze|Voir sur la page d’accueil
Account type|Ubwoko bwa konti|Type de compte
Accounts|Konti|Comptes
Name must be 150 characters or fewer.|Izina ntirigomba kurenza inyuguti 150.|Le nom ne doit pas dépasser 150 caractères.
organization|Umuryango|Organisation
institution|Ikigo|Institution
health_facility|Ikigo nderabuzima|Établissement de santé
other_business|Ubundi bucuruzi|Autre entreprise
Organization or business name|Izina ry’umuryango cyangwa ikigo|Nom de l’organisation ou de l’entreprise
Enter the name of your organization or business|Andika izina ry’umuryango cyangwa ikigo cyawe|Saisissez le nom de votre organisation ou entreprise
Personal account. Your name is recorded automatically on job cards.|Konti bwite. Izina ryawe ryandikwa ku mafishi y’akazi mu buryo bwikora.|Compte personnel. Votre nom est automatiquement inscrit sur les fiches d’intervention.
Shared account. Each job card records the name of the person submitting it.|Konti isangiwe. Buri fishi y’akazi yandikwaho izina ry’uyitanze.|Compte partagé. Chaque fiche indique le nom de la personne qui la soumet.
Submitter name|Izina ry’uwatanze ifishi|Nom du déclarant
Who is completing this job card? Enter your full name.|Ni nde wuzuza iyi fishi y’akazi? Andika amazina yawe yose.|Qui remplit cette fiche ? Saisissez votre nom complet.
Submitter name is required for shared accounts|Izina ry’uwatanze ifishi rirakenewe kuri konti isangiwe|Le nom du déclarant est obligatoire pour les comptes partagés
Loading account...|Konti irimo gutegurwa...|Chargement du compte...
Unable to load account. Please log in again.|Konti ntiyabonetse. Ongera winjire.|Impossible de charger le compte. Veuillez vous reconnecter.
Support email|Imeyili y’ubufasha|E-mail d’assistance
Phone|Telefoni|Téléphone
All rights reserved.|Uburenganzira bwose burabitswe.|Tous droits réservés.
Opens in a new tab|Bifungukira mu yindi tabu|S’ouvre dans un nouvel onglet
Post spare part|Tangaza igice gisimbura|Publier la pièce
Posted|Byatangajwe|Publiée
Posting...|Birimo gutangazwa...|Publication...
View posts|Reba ibyatangajwe|Voir les publications
Hide posts|Hisha ibyatangajwe|Masquer les publications
Spare-part board|Urubuga rw’ibice bisimbura|Tableau des pièces
Loading posts...|Ibyatangajwe birimo gutegurwa...|Chargement des publications...
No spare parts have been posted yet.|Nta bice bisimbura biratangazwa.|Aucune pièce publiée pour le moment.
Unable to post spare part.|Gutangaza igice gisimbura byanze.|Impossible de publier la pièce.
Unable to load posts.|Kubona ibyatangajwe byanze.|Impossible de charger les publications.
Load more|Reba ibindi|Afficher plus
Account status:|Uko konti ihagaze:|État du compte :
Job Card #|Ifishi y'akazi #|Fiche d’intervention n°
Technician #|Umutekinisiye #|Technicien n°
· Equipment #|· Igikoresho #|· Équipement n°
Outcome:|Ibyavuyemo:|Résultat :
Knowledge #|Ubumenyi #|Connaissance n°
Confidence|Icyizere|Fiabilité
Source Job Card #|Ifishi y'akazi yakomotseho #|Fiche d’origine n°
Diagnosis:|Isuzuma:|Diagnostic :
Solution:|Igisubizo:|Solution :
Part number:|Nomero y'igice:|Référence de la pièce :
Stored by technician #|Byabitswe n'umutekinisiye #|Enregistré par le technicien n°
Request #|Ubusabe #|Demande n°
Part:|Igice:|Pièce :
Availability:|Uko kiboneka:|Disponibilité :
Spare-part owner contact|Aho wabona nyir'igice gisimbura|Coordonnées du propriétaire de la pièce
Manufacturer:|Uruganda:|Fabricant :
Compatible equipment:|Ibikoresho bihuje na cyo:|Équipements compatibles :
Specifications:|Ibiranga igice:|Caractéristiques :
Description:|Ibisobanuro:|Description :
Requester:|Uwasabye:|Demandeur :
Contact:|Aho waboneka:|Contact :
Notes:|Ibisobanuro by'inyongera:|Notes :
Simeon Admin|Ubuyobozi bwa Simeon|Administration Simeon
Governance and technical knowledge control|Ubuyobozi no kugenzura ubumenyi bwa tekiniki|Gestion et contrôle des connaissances techniques
Logout|Sohoka|Se déconnecter
Admin Dashboard|Ibiro by'umuyobozi|Tableau de bord administrateur
Review technicians, maintenance records, knowledge, parts, and requests.|Reba abatekinisiye, inyandiko z'isanwa, ubumenyi, ibice n'ubusabe.|Consultez les techniciens, interventions, connaissances, pièces et demandes.
Refresh all|Vugurura byose|Tout actualiser
Loading admin data...|Amakuru y'ubuyobozi arimo gutegurwa...|Chargement des données administratives...
Intelligence Recovery program|Gahunda yo kugarura ubumenyi|Programme de récupération des connaissances
Full name|Amazina yose|Nom complet
Email|Imeyili|Adresse e-mail
Password|Ijambo ry'ibanga|Mot de passe
Phone (optional)|Telefoni (si ngombwa)|Téléphone (facultatif)
Intelligent Technician Friend|Inshuti y'umunyabwenge y'umutekinisiye|L’allié intelligent du technicien
Technician|Umutekinisiye|Technicien
Welcome to Simeon|Murakaza neza kuri Simeon|Bienvenue sur Simeon
What would you like to do today?|Ni iki wifuza gukora uyu munsi?|Que souhaitez-vous faire aujourd’hui ?
Store a Job Card or Spare Part|Bika ifishi y'akazi cyangwa igice gisimbura|Enregistrer une fiche ou une pièce de rechange
Save your maintenance experience, job cards, or spare-part information to help other technicians.|Bika ubunararibonye mu gusana, amafishi y'akazi cyangwa amakuru y'ibice bisimbura kugira ngo ufashe abandi batekinisiye.|Enregistrez vos expériences, fiches d’intervention ou pièces pour aider d’autres techniciens.
📋 Digital Job Card|📋 Ifishi y'akazi ikoranabuhanga|📋 Fiche d’intervention numérique
Record a maintenance activity, diagnosis, and solution.|Andika igikorwa cyo gusana, isuzuma n'igisubizo.|Consignez une intervention, un diagnostic et une solution.
🔩 Spare Part|🔩 Igice gisimbura|🔩 Pièce de rechange
Store information about an available spare part.|Bika amakuru y'igice gisimbura kiboneka.|Enregistrez les informations d’une pièce disponible.
Get Maintenance or Spare-Part Help|Bona ubufasha mu gusana cyangwa ku bice bisimbura|Obtenir de l’aide pour la maintenance ou les pièces
Ask Simeon about equipment problems, maintenance procedures, or spare parts.|Baza Simeon ku bibazo by'ibikoresho, uburyo bwo gusana cyangwa ibice bisimbura.|Interrogez Simeon sur les pannes, les procédures de maintenance ou les pièces.
🔧 Maintenance Help|🔧 Ubufasha mu gusana|🔧 Aide à la maintenance
Find reliable maintenance knowledge from successful job cards.|Bona ubumenyi bwizewe bwo gusana mu mafishi y'akazi kagenze neza.|Trouvez des connaissances fiables issues d’interventions réussies.
🔩 Spare-Part Help|🔩 Ubufasha ku bice bisimbura|🔩 Aide aux pièces de rechange
Search for spare parts stored by other technicians.|Shakisha ibice bisimbura byabitswe n'abandi batekinisiye.|Recherchez les pièces enregistrées par d’autres techniciens.
My Job Cards|Amafishi y'akazi yanjye|Mes fiches d’intervention
Review your maintenance records and confirm completed work.|Reba inyandiko zawe z'isanwa kandi wemeze akazi karangiye.|Consultez vos interventions et confirmez les travaux terminés.
Refresh|Vugurura|Actualiser
Loading your job cards...|Amafishi yawe y'akazi arimo gutegurwa...|Chargement de vos fiches...
You have not saved any job cards yet.|Nta fishi y'akazi urabika.|Vous n’avez pas encore enregistré de fiche.
Equipment ID:|Nomero y'igikoresho:|Identifiant de l’équipement :
Download PDF|Kuramo PDF|Télécharger le PDF
My Spare Parts|Ibice bisimbura byanjye|Mes pièces de rechange
View the spare parts you have stored.|Reba ibice bisimbura wabitse.|Consultez les pièces que vous avez enregistrées.
Loading your spare parts...|Ibice byawe bisimbura birimo gutegurwa...|Chargement de vos pièces...
You have not stored any spare parts yet.|Nta gice gisimbura urabika.|Vous n’avez pas encore enregistré de pièce.
Notifications:|Imenyesha:|Notifications :
Manufacturer|Uruganda|Fabricant
Compatible equipment|Ibikoresho bihuje na cyo|Équipements compatibles
Specifications|Ibiranga igice|Caractéristiques
Description|Ibisobanuro|Description
Digital Job Card|Ifishi y'akazi ikoranabuhanga|Fiche d’intervention numérique
Record what happened, what you found, and how the problem was resolved.|Andika ibyabaye, ibyo wabonye n'uko ikibazo cyakemuwe.|Décrivez les faits, vos observations et la résolution du problème.
Equipment|Igikoresho|Équipement
Model|Ubwoko bw'igikoresho|Modèle
Problem Description|Ibisobanuro by'ikibazo|Description du problème
Symptoms / Error|Ibimenyetso / Ikosa|Symptômes / Erreur
Diagnosis|Isuzuma|Diagnostic
Solution / Repair Performed|Igisubizo / Isanwa ryakozwe|Solution / Réparation effectuée
Parts Used|Ibice byakoreshejwe|Pièces utilisées
Job card photo (optional)|Ifoto y'ifishi y'akazi (si ngombwa)|Photo de l’intervention (facultative)
I confirm the maintenance was completed successfully. This will validate the job card and add it to Simeon's trusted technical knowledge.|Ndemeza ko isanwa ryarangiye neza. Ibi bizemeza ifishi y'akazi kandi biyongere ku bumenyi bwa tekiniki bwizewe bwa Simeon.|Je confirme que la maintenance a réussi. La fiche sera validée et ajoutée aux connaissances techniques fiables de Simeon.
Cancel|Hagarika|Annuler
Spare Part|Igice gisimbura|Pièce de rechange
Store technical information about an available spare part.|Bika amakuru ya tekiniki y'igice gisimbura kiboneka.|Enregistrez les informations techniques d’une pièce disponible.
Part Name|Izina ry'igice|Nom de la pièce
Part Number|Nomero y'igice|Référence de la pièce
Compatible Equipment|Ibikoresho bihuje na cyo|Équipements compatibles
Availability|Uko kiboneka|Disponibilité
Available|Kiraboneka|Disponible
Limited|Ni bike|Stock limité
Unavailable|Ntikiboneka|Indisponible
Unknown|Ntibizwi|Inconnue
Spare-part photo (optional)|Ifoto y'igice gisimbura (si ngombwa)|Photo de la pièce (facultative)
Ask Simeon about a equipment problem.|Baza Simeon ku kibazo cy'igikoresho.|Interrogez Simeon sur un problème d’équipement.
Search for a spare part stored by another technician.|Shakisha igice gisimbura cyabitswe n'undi mutekinisiye.|Recherchez une pièce enregistrée par un autre technicien.
My requests|Ubusabe bwanjye|Mes demandes
Loading requests...|Ubusabe burimo gutegurwa...|Chargement des demandes...
No spare-part requests yet.|Nta busabe bw'ibice bisimbura buraboneka.|Aucune demande de pièce pour le moment.
Choose a JPEG, PNG, or WebP image.|Hitamo ifoto ya JPEG, PNG cyangwa WebP.|Choisissez une image JPEG, PNG ou WebP.
Photo must be 5 MB or smaller.|Ifoto ntigomba kurenza MB 5.|La photo ne doit pas dépasser 5 Mo.
Unable to read the photo.|Ifoto ntishobora gusomwa.|Impossible de lire la photo.
Choose no more than 5 attachments.|Hitamo imigereka itarenze 5.|Choisissez au maximum 5 pièces jointes.
Attachments must be images or PDF files.|Imigereka igomba kuba amafoto cyangwa dosiye za PDF.|Les pièces jointes doivent être des images ou des PDF.
Each attachment must be 5 MB or smaller.|Buri mugereka ntugomba kurenza MB 5.|Chaque pièce jointe ne doit pas dépasser 5 Mo.
Unable to read an attachment.|Umugereka ntushobora gusomwa.|Impossible de lire une pièce jointe.
Maintenance successful|Isanwa ryagenze neza|Maintenance réussie
Pending confirmation|Bitegereje kwemezwa|En attente de confirmation
Not recorded|Ntibyanditswe|Non renseigné
Simeon Job Card|Ifishi y'akazi ya Simeon|Fiche d’intervention Simeon
Unable to load the admin dashboard.|Ibiro by'umuyobozi ntibishobora gufungurwa.|Impossible de charger le tableau de bord administrateur.
Technicians|Abatekinisiye|Techniciens
Job Cards|Amafishi y'akazi|Fiches d’intervention
Knowledge|Ubumenyi|Connaissances
Spare Parts|Ibice bisimbura|Pièces de rechange
Requests|Ubusabe|Demandes
No phone provided|Nta telefoni yatanzwe|Aucun téléphone renseigné
Updating...|Birimo kuvugururwa...|Mise à jour...
Deactivate|Hagarika konti|Désactiver
Activate|Fungura konti|Activer
Active|Irakora|Actif
Inactive|Ntikora|Inactif
Successful|Byagenze neza|Réussie
Not confirmed|Ntibyemejwe|Non confirmé
Not provided|Ntibyatanzwe|Non renseigné
No description provided|Nta bisobanuro byatanzwe|Aucune description renseignée
Unable to load your job cards.|Amafishi yawe y'akazi ntashobora kuboneka.|Impossible de charger vos fiches.
Unable to load your spare parts.|Ibice byawe bisimbura ntibishobora kuboneka.|Impossible de charger vos pièces.
Unable to load spare-part requests.|Ubusabe bw'ibice bisimbura ntibushobora kuboneka.|Impossible de charger les demandes de pièces.
Create Technician Account|Fungura konti y'umutekinisiye|Créer un compte technicien
Technician Login|Kwinjira k'umutekinisiye|Connexion technicien
Enter your full name|Andika amazina yawe yose|Saisissez votre nom complet
Enter your email|Andika imeyili yawe|Saisissez votre adresse e-mail
Enter your password|Andika ijambo ryawe ry'ibanga|Saisissez votre mot de passe
Enter your phone number|Andika nomero yawe ya telefoni|Saisissez votre numéro de téléphone
Full name, email, and password are required.|Amazina yose, imeyili n'ijambo ry'ibanga birakenewe.|Le nom complet, l’e-mail et le mot de passe sont obligatoires.
Account created. You can now log in.|Konti yafunguwe. Ushobora kwinjira ubu.|Compte créé. Vous pouvez maintenant vous connecter.
Create account|Fungura konti|Créer un compte
Login|Injira|Se connecter
Already have an account? Log in|Usanzwe ufite konti? Injira|Vous avez déjà un compte ? Connectez-vous
Need an account? Create one|Ukeneye konti? Yifungure|Besoin d’un compte ? Créez-en un
Job card|Ifishi y'akazi|Fiche d’intervention
Delete this validated job card and remove its trusted Simeon knowledge?|Usibe iyi fishi y'akazi yemejwe n'ubumenyi bwizewe bwa Simeon bujyanye na yo?|Supprimer cette fiche validée et les connaissances Simeon associées ?
Delete this job card?|Usibe iyi fishi y'akazi?|Supprimer cette fiche d’intervention ?
Unable to delete the job card.|Ifishi y'akazi ntishobora gusibwa.|Impossible de supprimer la fiche.
Deleting...|Birimo gusibwa...|Suppression...
Delete|Siba|Supprimer
Unable to confirm maintenance.|Isanwa ntirishobora kwemezwa.|Impossible de confirmer la maintenance.
Confirming...|Birimo kwemezwa...|Confirmation...
Confirm Maintenance Successful|Emeza ko isanwa ryagenze neza|Confirmer la réussite de la maintenance
Spare part|Igice gisimbura|Pièce de rechange
Delete this spare part? Existing requests for it will also be removed.|Usibe iki gice gisimbura? Ubusabe bwacyo na bwo burasibika.|Supprimer cette pièce ? Les demandes associées seront également supprimées.
Unable to delete the spare part.|Igice gisimbura ntigishobora gusibwa.|Impossible de supprimer la pièce.
Example: Humacount 30TS|Urugero: Humacount 30TS|Exemple : Humacount 30TS
Example: HUMAN|Urugero: HUMAN|Exemple : HUMAN
Equipment model|Ubwoko bw'igikoresho|Modèle de l’équipement
Describe the reported problem|Sobanura ikibazo cyatangajwe|Décrivez le problème signalé
What symptoms or error messages were observed?|Ni ibihe bimenyetso cyangwa ubutumwa bw'amakosa byagaragaye?|Quels symptômes ou messages d’erreur ont été observés ?
What was found to be causing the problem?|Ni iki cyagaragaye ko gitera ikibazo?|Quelle était la cause du problème ?
Describe the repair or maintenance performed|Sobanura isanwa cyangwa iyitabwaho ryakozwe|Décrivez la réparation ou la maintenance effectuée
Example: Sample probe tubing|Urugero: Umuyoboro w'urushinge rufata icyitegererezo|Exemple : Tubulure de la sonde de prélèvement
Job card preview|Ishusho y'ifishi y'akazi|Aperçu de la fiche
Equipment, manufacturer, and model are required.|Igikoresho, uruganda n'ubwoko birakenewe.|L’équipement, le fabricant et le modèle sont obligatoires.
Job card validated and added to Simeon knowledge.|Ifishi y'akazi yemejwe kandi yongewe ku bumenyi bwa Simeon.|Fiche validée et ajoutée aux connaissances de Simeon.
Job card saved. Confirm success to add it to Simeon knowledge.|Ifishi y'akazi yabitswe. Emeza ko byagenze neza kugira ngo yongerwe ku bumenyi bwa Simeon.|Fiche enregistrée. Confirmez la réussite pour l’ajouter aux connaissances de Simeon.
Unable to save the job card.|Ifishi y'akazi ntishobora kubikwa.|Impossible d’enregistrer la fiche.
Saving...|Birimo kubikwa...|Enregistrement...
Save Job Card|Bika ifishi y'akazi|Enregistrer la fiche
Example: Sample probe|Urugero: Urushinge rufata icyitegererezo|Exemple : Sonde de prélèvement
Example: PN-12345|Urugero: PN-12345|Exemple : PN-12345
Enter technical specifications|Andika ibiranga igice bya tekiniki|Saisissez les caractéristiques techniques
Describe the spare part and any compatibility information|Sobanura igice gisimbura n'ibikoresho bihuje na cyo|Décrivez la pièce et sa compatibilité
Spare-part preview|Ishusho y'igice gisimbura|Aperçu de la pièce
Spare part saved successfully.|Igice gisimbura cyabitswe neza.|Pièce enregistrée avec succès.
Unable to save the spare part.|Igice gisimbura ntigishobora kubikwa.|Impossible d’enregistrer la pièce.
Save Spare Part|Bika igice gisimbura|Enregistrer la pièce
Example: Humacount 30TS is giving a high blank error. What should I check?|Urugero: Humacount 30TS iratanga ikosa rya high blank. Ni iki ngomba kugenzura?|Exemple : Le Humacount 30TS affiche une erreur de blanc élevé. Que dois-je vérifier ?
Simeon could not process the request right now.|Simeon ntiyashoboye gusubiza ubusabe ubu.|Simeon ne peut pas traiter la demande pour le moment.
Thinking...|Birimo gutekerezwa...|Réflexion en cours...
Ask Simeon|Baza Simeon|Demander à Simeon
Example: Humacount 30TS sample probe|Urugero: Urushinge rufata icyitegererezo rwa Humacount 30TS|Exemple : Sonde de prélèvement Humacount 30TS
Unable to search spare parts.|Ibice bisimbura ntibishobora gushakishwa.|Impossible de rechercher les pièces.
Searching...|Birimo gushakishwa...|Recherche...
Search|Shakisha|Rechercher
Optional request note|Ibisobanuro by'ubusabe (si ngombwa)|Note de demande facultative
Unable to request spare part.|Igice gisimbura ntigishobora gusabwa.|Impossible de demander la pièce.
Requesting...|Ubusabe burimo koherezwa...|Envoi de la demande...
Request part|Saba igice|Demander la pièce
available|Kiraboneka|Disponible
limited|Ni bike|Stock limité
unavailable|Ntikiboneka|Indisponible
unknown|Ntibizwi|Inconnue
new|Bushya|Nouvelle
contacted|Bavugishijwe|Contact établi
negotiating|Mu biganiro|En négociation
confirmed|Byemejwe|Confirmée
ordered|Byatumijwe|Commandée
delivered|Byagejejweho|Livrée
completed|Byarangiye|Terminée
cancelled|Byahagaritswe|Annulée
draft|Inyandiko y'agateganyo|Brouillon
validated|Byemejwe|Validée
pending|Birategereje|En attente
technician|Umutekinisiye|Technicien
admin|Umuyobozi|Administrateur
Invalid email or password|Imeyili cyangwa ijambo ry'ibanga si byo|Adresse e-mail ou mot de passe incorrect
Registration failed|Gufungura konti byanze|Échec de l’inscription
Admin request failed|Ubusabe bw'umuyobozi bwanze|Échec de la demande administrateur
Failed to create chat session|Gutangiza ikiganiro byanze|Impossible de créer la conversation
Failed to send chat message|Kohereza ubutumwa byanze|Impossible d’envoyer le message
submitted|Byatanzwe|Soumise
corrective|Gukosora ikibazo|Corrective
preventive|Gukumira ibibazo|Préventive
Failed to save job card|Kubika ifishi y'akazi byanze|Impossible d’enregistrer la fiche
Failed to validate job card|Kwemeza ifishi y'akazi byanze|Impossible de valider la fiche
Failed to load job cards|Kubona amafishi y'akazi byanze|Impossible de charger les fiches
Failed to update job card|Kuvugurura ifishi y'akazi byanze|Impossible de mettre à jour la fiche
Failed to delete job card|Gusiba ifishi y'akazi byanze|Impossible de supprimer la fiche
Failed to save equipment|Kubika igikoresho byanze|Impossible d’enregistrer l’équipement
Failed to save spare part|Kubika igice gisimbura byanze|Impossible d’enregistrer la pièce
Failed to search spare parts|Gushakisha ibice bisimbura byanze|Impossible de rechercher les pièces
Failed to request spare part|Gusaba igice gisimbura byanze|Impossible de demander la pièce
Failed to load spare-part requests|Kubona ubusabe bw'ibice bisimbura byanze|Impossible de charger les demandes de pièces
Failed to load your spare parts|Kubona ibice byawe bisimbura byanze|Impossible de charger vos pièces
Failed to delete spare part|Gusiba igice gisimbura byanze|Impossible de supprimer la pièce
`;

export const translations = Object.fromEntries(rows.trim().split('\n').map((row) => {
  const [en, rw, fr] = row.split('|')
  return [en, { rw, fr, sw: swahili[en] }]
}))

export function translate(language, key) {
  return translations[key]?.[language] || key
}
