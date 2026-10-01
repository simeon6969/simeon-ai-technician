// English keys remain stable; stored enum values are never translated.
const rows = `
App branding|Ikirango cya porogaramu|Identité de l’application|Utambulisho wa programu
App name|Izina rya porogaramu|Nom de l’application|Jina la programu
App logo|Ikirango|Logo de l’application|Nembo ya programu
Remove logo|Kuraho ikirango|Supprimer le logo|Ondoa nembo
Branding saved.|Ikirango cyabitswe.|Identité enregistrée.|Utambulisho umehifadhiwa.
Choose an image up to 5 MB.|Hitamo ifoto itarengeje 5 MB.|Choisissez une image de 5 Mo maximum.|Chagua picha isiyozidi MB 5.
Include existing job cards|Ongeramo amafishi y’akazi asanzwe|Inclure les fiches existantes|Jumuisha kadi zilizopo
Job cards & Google Sheets|Amafishi y’akazi na Google Sheets|Fiches de travail et Google Sheets|Kadi za kazi na Google Sheets
Google Sheets connection|Ihuza rya Google Sheets|Connexion Google Sheets|Muunganisho wa Google Sheets
Open job-card spreadsheet|Fungura urupapuro rw’amafishi y’akazi|Ouvrir le tableau des fiches|Fungua lahajedwali la kadi za kazi
Backend credentials configured. Share the spreadsheet with the account below as Editor.|Ibyangombwa by’ihuza byashyizweho. Sangiza konti iri hasi uru rupapuro uyigire Editor.|Identifiants configurés. Partagez le tableau avec le compte ci-dessous comme éditeur.|Utambulisho wa seva umewekwa. Shiriki lahajedwali na akaunti iliyo hapa chini kama mhariri.
Google credentials are not configured. Job cards remain safe in the database and wait to sync.|Ibyangombwa bya Google ntibirashyirwaho. Amafishi abikwa muri databaze ategereje koherezwa.|Les identifiants Google ne sont pas configurés. Les fiches restent en base de données en attente de synchronisation.|Utambulisho wa Google haujawekwa. Kadi zinahifadhiwa kwenye hifadhidata zikisubiri kusawazishwa.
Waiting to sync|Bitegereje koherezwa|En attente de synchronisation|Inasubiri kusawazishwa
Synced job cards|Amafishi yoherejwe|Fiches synchronisées|Kadi zilizosawazishwa
Spreadsheet link|Ihuza ry’urupapuro|Lien du tableur|Kiungo cha lahajedwali
Enable Google Sheets sync|Emera kohereza muri Google Sheets|Activer la synchronisation Google Sheets|Wezesha usawazishaji wa Google Sheets
Save connection settings|Bika igenamiterere ry’ihuza|Enregistrer la connexion|Hifadhi mipangilio ya muunganisho
Refresh sync status|Vugurura uko kohereza bihagaze|Actualiser la synchronisation|Sasisha hali ya usawazishaji
Retry pending sync|Ongera wohereze ibitegereje|Réessayer les envois en attente|Jaribu tena usawazishaji unaosubiri
Job-card questions|Ibibazo by’ifishi y’akazi|Questions de la fiche de travail|Maswali ya kadi ya kazi
Changes apply to new conversations. Existing drafts and answers keep their original questions. Each version uses a separate spreadsheet tab.|Impinduka zireba ibiganiro bishya. Inyandiko n’ibisubizo bya kera bigumana ibibazo byabyo. Buri verisiyo ikoresha tab yayo.|Les changements concernent les nouvelles conversations. Les brouillons et réponses existants gardent leurs questions. Chaque version utilise un onglet distinct.|Mabadiliko yanahusu mazungumzo mapya. Rasimu na majibu yaliyopo yanabaki na maswali yake. Kila toleo hutumia kichupo tofauti.
Edit question wording and help, or add custom text questions. Essential job-card fields stay required.|Hindura ibibazo n’ibisobanuro cyangwa wongere ibibazo byandikwa. Iby’ingenzi ku ifishi bikomeza kuba ngombwa.|Modifiez les libellés et l’aide, ou ajoutez des questions libres. Les champs essentiels restent obligatoires.|Hariri maneno na msaada au ongeza maswali ya maandishi. Sehemu muhimu hubaki za lazima.
Question / column heading|Ikibazo / umutwe w’inkingi|Question / titre de colonne|Swali / kichwa cha safu
Question help|Ibisobanuro by’ikibazo|Aide de la question|Msaada wa swali
Required answer|Igisubizo gisabwa|Réponse obligatoire|Jibu la lazima
Remove question|Kuraho ikibazo|Supprimer la question|Ondoa swali
Add question|Ongeraho ikibazo|Ajouter une question|Ongeza swali
Publish questions|Emeza ibibazo|Publier les questions|Chapisha maswali
Account location|Aho konti ibarizwa|Localisation du compte|Mahali pa akaunti
Location or address|Aho ubarizwa cyangwa aderesi|Localisation ou adresse|Mahali au anwani
Enter your address or business location, including city, district and street or landmark.|Andika aderesi yawe cyangwa aho ukorera, harimo umujyi, akarere n’umuhanda cyangwa ahantu hazwi hafi.|Indiquez votre adresse ou celle de votre entreprise : ville, district, rue ou point de repère.|Weka anwani yako au mahali pa biashara, ikiwemo mji, wilaya, barabara au alama ya karibu.
Leave blank and save to remove your location.|Siga ubusa ubike kugira ngo ukureho aho ubarizwa.|Laissez vide et enregistrez pour supprimer la localisation.|Acha wazi na uhifadhi ili kuondoa mahali ulipo.
Profile picture or company logo|Ifoto ya konti cyangwa ikirango cy’ikigo|Photo de profil ou logo de l’entreprise|Picha ya wasifu au nembo ya kampuni
Your image appears above the heading on downloaded job cards.|Ifoto yawe igaragara hejuru y’umutwe w’amafishi y’akazi ukuramo.|Votre image apparaît au-dessus du titre des fiches de travail téléchargées.|Picha yako inaonekana juu ya kichwa cha kadi za kazi zinazopakuliwa.
Upload image|Ohereza ifoto|Téléverser une image|Pakia picha
Remove image|Kuraho ifoto|Supprimer l’image|Ondoa picha
Choose a valid JPEG, PNG, or WebP image up to 5 MB.|Hitamo ifoto ya JPEG, PNG cyangwa WebP itarengeje MB 5.|Choisissez une image JPEG, PNG ou WebP valide de 5 Mo maximum.|Chagua picha halali ya JPEG, PNG au WebP isiyozidi MB 5.
Show password|Erekana ijambo ry’ibanga|Afficher le mot de passe|Onyesha nenosiri
Hide password|Hisha ijambo ry’ibanga|Masquer le mot de passe|Ficha nenosiri
Close|Funga|Fermer|Funga
Approval notifications|Imenyesha ry’ibyemejwe|Notifications d’approbation|Arifa za idhini
Refresh approvals|Vugurura ibyemejwe|Actualiser les approbations|Sasisha idhini
Admin approved your requests. Seller contacts are unlocked.|Umuyobozi yemeje ubusabe bwawe. Amakuru y’ugurisha yafunguwe.|L’administrateur a approuvé vos demandes. Les coordonnées sont débloquées.|Msimamizi ameidhinisha maombi yako. Mawasiliano ya muuzaji yamefunguliwa.
Approvals will appear here after admin confirms payment.|Ibyemejwe bizagaragara hano umuyobozi amaze kwemeza ubwishyu.|Les approbations apparaîtront ici après confirmation du paiement.|Idhini itaonekana hapa baada ya msimamizi kuthibitisha malipo.
Unable to refresh approvals. Please try again.|Kuvugurura ibyemejwe byanze. Ongera ugerageze.|Impossible d’actualiser les approbations. Réessayez.|Imeshindwa kusasisha idhini. Jaribu tena.
View unlocked seller contacts|Reba amakuru y’ugurisha yafunguwe|Voir les coordonnées débloquées|Angalia mawasiliano yaliyofunguliwa
Refresh requests|Vugurura ubusabe|Actualiser les demandes|Sasisha maombi
Payment notifications|Imenyesha ry’ubwishyu|Notifications de paiement|Arifa za malipo
Payments awaiting review|Ubwishyu butegereje kugenzurwa|Paiements à vérifier|Malipo yanayosubiri ukaguzi
Refresh payments|Vugurura ubwishyu|Actualiser les paiements|Sasisha malipo
Oldest submissions first. Opening a notification does not clear it.|Ubwishyu bwa kera buza mbere. Gufungura imenyesha ntibirivanaho.|Les soumissions les plus anciennes apparaissent en premier. Ouvrir une notification ne l’efface pas.|Malipo ya zamani huonekana kwanza. Kufungua arifa hakuiondoi.
Refreshes every 30 seconds while this dashboard is visible.|Bivugururwa buri masegonda 30 igihe iyi paji igaragara.|Actualisation toutes les 30 secondes lorsque ce tableau de bord est visible.|Inasasishwa kila sekunde 30 dashibodi hii inapoonekana.
Unable to refresh payment notifications. Previously loaded reminders are kept.|Kuvugurura imenyesha ry’ubwishyu byanze. Ibyari byafunguwe biragumaho.|Impossible d’actualiser les notifications. Les rappels déjà chargés sont conservés.|Imeshindwa kusasisha arifa za malipo. Vikumbusho vilivyopakiwa vinahifadhiwa.
No payments awaiting review|Nta bwishyu butegereje kugenzurwa|Aucun paiement à vérifier|Hakuna malipo yanayosubiri ukaguzi
Submitted for review|Byoherejwe kugenzurwa|Soumis pour vérification|Imetumwa kwa ukaguzi
Review this payment|Suzuma ubu bwishyu|Vérifier ce paiement|Kagua malipo haya
Pending reminders stay visible until approved or returned for correction.|Imenyesha rigumaho kugeza byemejwe cyangwa bisubijwe gukosorwa.|Les rappels restent visibles jusqu’à approbation ou renvoi pour correction.|Vikumbusho vinabaki hadi kuidhinishwa au kurudishwa kwa marekebisho.
S has reached the lowest permitted commission|S yageze kuri komisiyo ntoya yemerewe|S a atteint la commission minimale autorisée|S amefikia kamisheni ya chini inayoruhusiwa
Enter a counteroffer below the current percentage|Andika ijanisha riri munsi y’irisanzwe|Saisissez un taux inférieur au taux actuel|Weka asilimia iliyo chini ya ya sasa
The negotiation changed. Refresh before continuing.|Ibiganiro byahindutse. Vugurura mbere yo gukomeza.|La négociation a changé. Actualisez avant de continuer.|Mazungumzo yamebadilika. Sasisha kabla ya kuendelea.
Only the selected payer can negotiate or submit payment|Uwatoranyijwe kwishyura ni we wenyine uganira cyangwa wohereza ubwishyu|Seul le payeur désigné peut négocier ou soumettre un paiement|Mlipaji aliyechaguliwa pekee anaweza kujadiliana au kutuma malipo
Only admin can confirm payment|Umuyobozi ni we wenyine wemeza ubwishyu|Seul l’administrateur peut confirmer le paiement|Msimamizi pekee anaweza kuthibitisha malipo
Payment must be submitted before review|Ubwishyu bugomba koherezwa mbere yo kugenzurwa|Le paiement doit être soumis avant vérification|Malipo lazima yatumwe kabla ya ukaguzi
Explain why the payment needs correction|Sobanura impamvu ubwishyu bugomba gukosorwa|Expliquez pourquoi le paiement doit être corrigé|Eleza kwa nini malipo yanahitaji marekebisho
This offer is already accepted|Iki cyifuzo cyamaze kwemerwa|Cette offre est déjà acceptée|Ofa hii tayari imekubaliwa
Accept the offer and provide a payment reference first|Banza wemere icyifuzo utange nimero y’ubwishyu|Acceptez l’offre et fournissez une référence de paiement|Kubali ofa na utoe kumbukumbu ya malipo kwanza
Start the negotiation first|Banza utangire ibiganiro|Commencez d’abord la négociation|Anza mazungumzo kwanza
The item needs a listed price before negotiating a commission|Igicuruzwa kigomba kugira igiciro mbere yo kuganira kuri komisiyo|L’article doit avoir un prix avant la négociation de commission|Bidhaa inahitaji bei kabla ya kujadiliana kamisheni
This item request is no longer available|Ubu busabe ntibukiboneka|Cette demande n’est plus disponible|Ombi hili halipatikani tena
This request is private|Ubu busabe ni ibanga|Cette demande est privée|Ombi hili ni la faragha
Commission settings|Igenamiterere rya komisiyo|Paramètres de commission|Mipangilio ya kamisheni
Refresh negotiation|Vugurura ibiganiro|Actualiser la négociation|Sasisha mazungumzo
S: seller information|S: amakuru y’ugurisha|S : coordonnées du vendeur|S: taarifa za muuzaji
Seller contacts stay locked until admin confirms the commission payment.|Aho kubariza ugurisha haguma hafunze kugeza umuyobozi yemeje ubwishyu bwa komisiyo.|Les coordonnées restent masquées jusqu’à confirmation du paiement par l’administrateur.|Mawasiliano yanafichwa hadi msimamizi athibitishe malipo ya kamisheni.
Commission negotiations are not configured by admin yet|Umuyobozi ntarashyiraho ibiganiro bya komisiyo|La négociation des commissions n’est pas encore activée|Msimamizi hajawezesha mazungumzo ya kamisheni
Start negotiation|Tangira ibiganiro|Commencer la négociation|Anza mazungumzo
Commission payer|Uwishyura komisiyo|Payeur de la commission|Mlipaji wa kamisheni
Requesting client|Umukiriya wasabye|Client demandeur|Mteja anayeomba
Listed price|Igiciro cyatangajwe|Prix affiché|Bei iliyotangazwa
My commission offer|Komisiyo mbasaba|Ma proposition de commission|Pendekezo langu la kamisheni
This fee is for access to seller information, separate from the item price.|Aya mafaranga ni ayo kubona amakuru y’ugurisha, atandukanye n’igiciro cy’igicuruzwa.|Ces frais donnent accès aux coordonnées du vendeur et sont distincts du prix de l’article.|Ada hii ni ya kupata taarifa za muuzaji, tofauti na bei ya bidhaa.
Commission status|Uko komisiyo ihagaze|État de la commission|Hali ya kamisheni
Waiting for the selected payer and admin payment confirmation.|Dutegereje uwatoranyijwe kwishyura n’icyemezo cy’umuyobozi.|En attente du payeur désigné et de la confirmation de l’administrateur.|Inasubiri mlipaji aliyechaguliwa na uthibitisho wa msimamizi.
You can accept my offer or suggest a lower percentage. I can reduce it gradually within the approved limits.|Ushobora kwemera cyangwa gusaba ijanisha rito. Nshobora kurigabanya buhoro mu mbibi zemejwe.|Vous pouvez accepter ou proposer un taux inférieur. Je peux le réduire progressivement dans les limites autorisées.|Unaweza kukubali au kupendekeza asilimia ndogo. Ninaweza kupunguza hatua kwa hatua ndani ya mipaka iliyoruhusiwa.
Your counteroffer (%)|Ijanisha usaba (%)|Votre contre-proposition (%)|Pendekezo lako (%)
Negotiate|Ganira ku giciro|Négocier|Jadiliana
Accept commission offer|Emera komisiyo|Accepter la commission|Kubali kamisheni
Pay the agreed commission via MoMo to|Ishyura komisiyo mwumvikanye kuri MoMo|Payez la commission convenue par MoMo au|Lipa kamisheni iliyokubaliwa kupitia MoMo kwa
Submitting a reference does not confirm payment. Admin verifies it manually.|Kohereza nimero y’ubwishyu si ukwemeza ubwishyu. Umuyobozi arabugenzura.|L’envoi d’une référence ne confirme pas le paiement. L’administrateur le vérifie manuellement.|Kutuma kumbukumbu hakuthibitishi malipo. Msimamizi atayakagua.
MoMo transaction reference|Nimero y’ubwishyu bwa MoMo|Référence de transaction MoMo|Kumbukumbu ya muamala wa MoMo
Submit payment for review|Ohereza ubwishyu bugenzurwe|Soumettre le paiement pour vérification|Tuma malipo yakaguliwe
Admin review note|Icyitonderwa cy’umuyobozi|Note de vérification de l’administrateur|Maelezo ya ukaguzi wa msimamizi
Minimum percentage|Ijanisha rito ntarengwa|Pourcentage minimum|Asilimia ya chini
Reduction per round|Igabanywa kuri buri kiganiro|Réduction par tour|Punguzo kwa kila hatua
Confirm payment is verified and unlock seller contacts for this client?|Emeza ko ubwishyu bwagenzuwe maze ufungurire umukiriya amakuru y’ugurisha?|Confirmer la vérification du paiement et débloquer les coordonnées pour ce client ?|Thibitisha malipo yamehakikiwa na fungua mawasiliano kwa mteja huyu?
Confirm payment and unlock|Emeza ubwishyu ufungure amakuru|Confirmer le paiement et débloquer|Thibitisha malipo na fungua
Return payment for correction|Subiza ubwishyu bukosorwe|Renvoyer pour correction|Rudisha malipo yasahihishwe
Seller contacts unlocked|Amakuru y’ugurisha yafunguwe|Coordonnées du vendeur débloquées|Mawasiliano ya muuzaji yamefunguliwa
Negotiation history|Amateka y’ibiganiro|Historique de négociation|Historia ya mazungumzo
Changes apply to new negotiations. Existing offers keep their recorded terms.|Impinduka zireba ibiganiro bishya. Ibyatangiye bigumana amasezerano yabyo.|Les modifications concernent les nouvelles négociations. Les offres existantes conservent leurs conditions.|Mabadiliko yanahusu mazungumzo mapya. Ofa zilizopo zinabaki na masharti yake.
Review payments in Item requests. Approval confirms all required payments and unlocks contacts for that client only.|Suzuma ubwishyu mu busabe bw’ibintu. Kwemeza byemeza ubwishyu bwose busabwa kandi bigafungurira amakuru uwo mukiriya gusa.|Vérifiez les paiements dans les demandes d’articles. L’approbation confirme tous les paiements requis et débloque les coordonnées pour ce client uniquement.|Kagua malipo kwenye maombi ya bidhaa. Idhini inathibitisha malipo yote yanayotakiwa na kufungua mawasiliano kwa mteja huyo tu.
Load settings|Fungura igenamiterere|Charger les paramètres|Pakia mipangilio
Enable commission negotiations|Emera ibiganiro bya komisiyo|Activer la négociation des commissions|Wezesha mazungumzo ya kamisheni
Starting percentage|Ijanisha ritangirwaho|Pourcentage de départ|Asilimia ya kuanzia
The reduction is measured in percentage points per round.|Igabanywa ripimwa mu ngingo z’ijanisha kuri buri kiganiro.|La réduction est exprimée en points de pourcentage par tour.|Punguzo hupimwa kwa pointi za asilimia kwa kila hatua.
MoMo number|Nimero ya MoMo|Numéro MoMo|Nambari ya MoMo
No commission payment is due. Admin approval is still required to unlock contacts.|Nta komisiyo igomba kwishyurwa. Umuyobozi aracyasabwa kwemeza kugira ngo amakuru afungurwe.|Aucune commission n’est due. L’approbation de l’administrateur reste nécessaire.|Hakuna kamisheni ya kulipa. Idhini ya msimamizi bado inahitajika.
Not started|Ntibiratangira|Non commencée|Haijaanza
Negotiating commission|Ibiganiro birakomeje|En négociation|Inajadiliwa
Awaiting commission payment|Hategerejwe ubwishyu|En attente de paiement|Inasubiri malipo
Awaiting admin review|Hategerejwe umuyobozi|En attente de vérification|Inasubiri ukaguzi
Commission approved|Byemejwe|Approuvée|Imeidhinishwa
Negotiation started|Ibiganiro byatangiye|Négociation commencée|Mazungumzo yameanza
New offer from S|Icyifuzo gishya cya S|Nouvelle proposition de S|Pendekezo jipya la S
Commission offer accepted|Icyifuzo cyemewe|Offre acceptée|Ofa imekubaliwa
Payment submitted|Ubwishyu bwoherejwe|Paiement soumis|Malipo yametumwa
Payment approved by admin|Umuyobozi yemeje|Approbation de l’administrateur|Msimamizi ameidhinisha
Payment correction requested|Ubwishyu busabwe gukosorwa|Correction demandée|Marekebisho yameombwa
Photo not available|Ifoto ntiboneka|Photo indisponible|Picha haipatikani
Access will be blocked until admin confirms payment.|Kwinjira birahagarikwa kugeza umuyobozi yemeje ubwishyu.|L’accès sera bloqué jusqu’à confirmation du paiement par l’administrateur.|Ufikiaji utazuiwa hadi msimamizi athibitishe malipo.
Confirm upgrade?|Emeza kuzamura ifatabuguzi?|Confirmer le changement d’offre ?|Unathibitisha kupandisha mpango?
Loading...|Birimo gufunguka...|Chargement...|Inapakia...
Choose your subscription|Hitamo ifatabuguzi|Choisissez votre abonnement|Chagua usajili wako
Your account was created before a subscription was selected. Review the plans to continue. Your existing records will stay in your account.|Konti yawe yafunguwe nta fatabuguzi ryatoranyijwe. Reba amahitamo ukomeze. Inyandiko zawe ziragumaho.|Votre compte a été créé sans choix d’abonnement. Consultez les offres pour continuer. Vos données seront conservées.|Akaunti yako iliundwa kabla ya kuchagua usajili. Kagua mipango ili kuendelea. Rekodi zako zitabaki.
Save subscription and continue|Bika ifatabuguzi ukomeze|Enregistrer et continuer|Hifadhi usajili na uendelee
My subscription|Ifatabuguzi ryanjye|Mon abonnement|Usajili wangu
Payment:|Ubwishyu:|Paiement :|Malipo:
All current services are included. Contact admin to change your plan.|Serivisi zose zirimo. Vugana n’umuyobozi guhindura ifatabuguzi.|Tous les services actuels sont inclus. Contactez l’administrateur pour changer d’offre.|Huduma zote za sasa zimejumuishwa. Wasiliana na msimamizi kubadilisha mpango.
Retry prices|Ongera ufungure ibiciro|Recharger les prix|Jaribu kupakia bei tena
Loading plans…|Turimo gufungura amahitamo…|Chargement des offres…|Inapakia mipango…
Subscription|Ifatabuguzi|Abonnement|Usajili
Display currency|Ifaranga ryo kwerekana|Devise d’affichage|Sarafu ya kuonyesha
All plans include all services in this version. An admin upgrade may require payment confirmation before account access. No automatic renewal or automatic charge. Service differences may be introduced in a future update.|Amafatabuguzi yose arimo serivisi zose muri iyi verisiyo. Kuzamurwa n’umuyobozi bishobora gusaba kwemeza ubwishyu mbere yo kwinjira. Nta kwiyongera cyangwa kwishyura byikora. Serivisi zishobora gutandukana muri verisiyo zizaza.|Toutes les offres incluent tous les services dans cette version. Un changement par l’administrateur peut nécessiter un paiement confirmé avant l’accès. Aucun renouvellement ni prélèvement automatique. Les services pourront différer à l’avenir.|Mipango yote inajumuisha huduma zote katika toleo hili. Kupandishwa na msimamizi kunaweza kuhitaji uthibitisho wa malipo kabla ya kuingia. Hakuna kusasisha au kutoza kiotomatiki. Huduma zinaweza kutofautiana baadaye.
Pay|Ishyura|Payez|Lipa
by MoMo to|kuri MoMo ya|par MoMo au|kwa MoMo kwa
. Admin confirms payment manually; choosing a plan does not confirm payment.|. Umuyobozi ni we wemeza ubwishyu; guhitamo ifatabuguzi si ukwemeza ubwishyu.|. L’administrateur confirme le paiement manuellement ; choisir une offre ne confirme pas le paiement.|. Msimamizi anathibitisha malipo mwenyewe; kuchagua mpango hakuthibitishi malipo.
Converted display estimate. MoMo payment is in RWF.|Iki ni igiciro kigereranyijwe mu rindi faranga. MoMo yishyurwa muri RWF.|Estimation convertie. Le paiement MoMo s’effectue en RWF.|Makadirio yaliyobadilishwa. Malipo ya MoMo ni kwa RWF.
I have reviewed the subscription price and payment terms.|Nasomye igiciro n’amabwiriza yo kwishyura.|J’ai lu le prix et les conditions de paiement.|Nimekagua bei ya usajili na masharti ya malipo.
Loading subscriptions…|Turimo gufungura amafatabuguzi…|Chargement des abonnements…|Inapakia usajili…
Subscriptions|Amafatabuguzi|Abonnements|Usajili
All plans retain every service; accounts upgraded by admin require confirmed payment. Changes apply to new selections; existing quoted prices stay unchanged. Free remains 0 RWF.|Amafatabuguzi yose agumana serivisi zose; konti yazamuwe n’umuyobozi isaba ubwishyu bwemejwe. Impinduka zireba amahitamo mashya; ibiciro byemejwe ntibihinduka. Ubuntu buguma kuri 0 RWF.|Toutes les offres conservent tous les services ; les comptes surclassés nécessitent un paiement confirmé. Les changements concernent les nouvelles sélections ; les prix déjà fixés restent inchangés. L’offre gratuite reste à 0 RWF.|Mipango yote inabaki na huduma zote; akaunti zilizopandishwa zinahitaji malipo yaliyothibitishwa. Mabadiliko yanahusu chaguo jipya; bei zilizotolewa hazibadiliki. Bure inabaki RWF 0.
Default billing period|Igihe gisanzwe cyo kwishyura|Période de facturation par défaut|Kipindi chaguomsingi cha malipo
Monthly|Buri kwezi|Mensuel|Kila mwezi
Yearly|Buri mwaka|Annuel|Kila mwaka
month|ukwezi|mois|mwezi
year|umwaka|an|mwaka
free|ubuntu|gratuit|bure
standard|isanzwe|standard|kawaida
premium|isumbuye|premium|ya juu
Standard|Isanzwe|Standard|Kawaida
Premium|Isumbuye|Premium|Ya juu
paid|byishyuwe|payé|imelipwa
waived|byasonewe|exonéré|imesamehewa
not required|ntibisabwa|non requis|haihitajiki
MoMo number|Nomero ya MoMo|Numéro MoMo|Nambari ya MoMo
Conversion rates|Ibipimo by’ivunjisha|Taux de conversion|Viwango vya ubadilishaji
Enter how many RWF equal 1 unit of each currency. Uncheck a currency to hide it at signup. These rates are maintained here, not updated automatically.|Andika RWF zingana na 1 ya buri faranga. Kuraho akamenyetso kugira ngo ifaranga ritagaragara mu kwiyandikisha. Ibi bipimo bihindurwa hano, ntibyikora.|Indiquez combien de RWF valent une unité de chaque devise. Décochez une devise pour la masquer à l’inscription. Ces taux sont gérés ici, sans mise à jour automatique.|Weka RWF zinazolingana na kipimo 1 cha kila sarafu. Ondoa tiki kuficha sarafu wakati wa kujisajili. Viwango hivi vinasimamiwa hapa, havisasishwi kiotomatiki.
in RWF|muri RWF|en RWF|kwa RWF
Rate date / source note|Itariki / inkomoko y’igipimo|Date ou source du taux|Tarehe / chanzo cha kiwango
Save subscription settings|Bika igenamiterere ry’amafatabuguzi|Enregistrer les paramètres|Hifadhi mipangilio ya usajili
Subscription settings saved.|Igenamiterere ry’amafatabuguzi ryabitswe.|Paramètres d’abonnement enregistrés.|Mipangilio ya usajili imehifadhiwa.
Account subscriptions|Amafatabuguzi ya konti|Abonnements des comptes|Usajili wa akaunti
No payment required|Nta bwishyu busabwa|Aucun paiement requis|Hakuna malipo yanayohitajika
Payment status|Uko ubwishyu buhagaze|État du paiement|Hali ya malipo
Confirm you have verified this MoMo payment?|Emeza ko wagenzuye ubu bwishyu bwa MoMo.|Confirmez-vous avoir vérifié ce paiement MoMo ?|Unathibitisha kuwa umekagua malipo haya ya MoMo?
Upgrade subscription|Zamura ifatabuguzi|Passer à une offre supérieure|Pandisha mpango wa usajili
Higher plan|Ifatabuguzi risumbuye|Offre supérieure|Mpango wa juu
Billing period|Igihe cyo kwishyura|Période de facturation|Kipindi cha malipo
RWF per|RWF buri|RWF par|RWF kwa
. Access will be blocked until admin confirms payment.|. Kwinjira birahagarikwa kugeza umuyobozi yemeje ubwishyu.|. L’accès sera bloqué jusqu’à confirmation du paiement.|. Ufikiaji utazuiwa hadi msimamizi athibitishe malipo.
Upgrade and require payment|Zamura usabe ubwishyu|Surclasser et exiger le paiement|Pandisha na hitaji malipo
Set up account recovery|Tegura uburyo bwo kugarura konti|Configurer la récupération du compte|Weka urejeshaji wa akaunti
Forgot password or account name?|Wibagiwe ijambo ry’ibanga cyangwa izina rya konti?|Mot de passe ou nom de compte oublié ?|Umesahau nenosiri au jina la akaunti?
Choose a private question and a long answer that others cannot guess. Remember both. Your current password is required to set or replace them.|Hitamo ikibazo cy’ibanga n’igisubizo kirekire abandi badashobora gukeka. Byibuke byombi. Bisaba ijambo ry’ibanga ukoresha ubu kubishyiraho cyangwa kubihindura.|Choisissez une question privée et une réponse longue difficile à deviner. Retenez les deux. Votre mot de passe actuel est requis pour les définir ou les remplacer.|Chagua swali la siri na jibu refu lisilokisiwa kwa urahisi. Kumbuka vyote. Nenosiri lako la sasa linahitajika kuviweka au kubadilisha.
Enter your registered email and the question and answer you previously saved. Names are display names; you still sign in with your email. Set a new name, password, or both.|Andika imeli wiyandikishijeho n’ikibazo n’igisubizo wabikaga. Izina ni iryo kwerekana; winjira ukoresheje imeli. Shyiraho izina rishya, ijambo ry’ibanga cyangwa byombi.|Saisissez votre e-mail et la question et réponse enregistrées. Le nom est un nom d’affichage ; la connexion utilise toujours l’e-mail. Définissez un nouveau nom, mot de passe ou les deux.|Weka barua pepe yako na swali na jibu ulilohifadhi. Majina ni ya kuonyesha; bado unaingia kwa barua pepe. Weka jina jipya, nenosiri au vyote.
Five incorrect attempts lock recovery for 30 minutes. If you never set a question or cannot remember it, contact support.|Kugerageza nabi inshuro eshanu bihagarika kugarura konti iminota 30. Niba utarashyizeho ikibazo cyangwa utacyibuka, saba ubufasha.|Cinq tentatives incorrectes bloquent la récupération pendant 30 minutes. Sans question enregistrée ou si vous l’avez oubliée, contactez l’assistance.|Majaribio matano yasiyo sahihi hufunga urejeshaji kwa dakika 30. Ikiwa hukuwa umeweka swali au hulikumbuki, wasiliana na usaidizi.
Current password|Ijambo ry’ibanga ukoresha ubu|Mot de passe actuel|Nenosiri la sasa
Secret question|Ikibazo cy’ibanga|Question secrète|Swali la siri
Secret answer|Igisubizo cy’ibanga|Réponse secrète|Jibu la siri
Registered email|Imeli wiyandikishijeho|E-mail enregistré|Barua pepe iliyosajiliwa
New account name (optional)|Izina rishya rya konti (si ngombwa)|Nouveau nom de compte (facultatif)|Jina jipya la akaunti (si lazima)
New password (optional, at least 12 characters)|Ijambo ry’ibanga rishya (si ngombwa, nibura inyuguti 12)|Nouveau mot de passe (facultatif, 12 caractères minimum)|Nenosiri jipya (si lazima, angalau herufi 12)
Save recovery question|Bika ikibazo cyo kugarura konti|Enregistrer la question|Hifadhi swali la urejeshaji
Verify and update account|Genzura uhindure konti|Vérifier et modifier le compte|Thibitisha na usasishe akaunti
Payment required|Ubwishyu burakenewe|Paiement requis|Malipo yanahitajika
Payment confirmation required|Kwemeza ubwishyu birakenewe|Confirmation du paiement requise|Uthibitisho wa malipo unahitajika
Check again|Ongera ugenzure|Vérifier à nouveau|Kagua tena
Back to login|Subira aho winjirira|Retour à la connexion|Rudi kwenye kuingia
How many stock units are available?|Ni ibipimo bingahe biri mu bubiko?|Combien d’unités sont disponibles ?|Kuna vipimo vingapi vya akiba?
What is the stock and selling unit? For example: box of 100, bottle of 60, or one device.|Ni ikihe gipimo cyo kubika no kugurisha? Urugero: agasanduku ka 100, icupa rya 60, cyangwa igikoresho kimwe.|Quelle est l’unité de stock et de vente ? Par exemple : boîte de 100, flacon de 60 ou un appareil.|Kipimo cha akiba na mauzo ni kipi? Kwa mfano: sanduku la 100, chupa ya 60 au kifaa kimoja.
Who is the manufacturer?|Ni nde wabikoze?|Qui est le fabricant ?|Mtengenezaji ni nani?
Where is this stock stored? Shelf, bin, or room.|Bibitswe he? Etajeri, agasanduku cyangwa icyumba.|Où ce stock est-il rangé ? Étagère, bac ou salle.|Akiba hii imehifadhiwa wapi? Rafu, sanduku au chumba.
Who supplied this stock?|Ni nde watanze ibi bicuruzwa?|Qui a fourni ce stock ?|Nani alisambaza akiba hii?
When was it received?|Byakiriwe ryari?|Quand a-t-il été reçu ?|Ilipokelewa lini?
At what quantity should you reorder?|Wakongera kurangura hasigaye bingahe?|À quelle quantité faut-il recommander ?|Uagize upya ikibaki kiasi gani?
Add any product notes or specifications to show buyers.|Andika amakuru n’ibisobanuro abaguzi bazabona.|Ajoutez les notes ou spécifications destinées aux acheteurs.|Ongeza maelezo au vipimo kwa wanunuzi.
What is the selling price per stock unit?|Igiciro cya buri gipimo ni angahe?|Quel est le prix de vente par unité ?|Bei ya kuuza kwa kila kipimo ni kiasi gani?
Which currency?|Ni irihe faranga?|Quelle devise ?|Sarafu ipi?
Upload a clear product or label photo.|Shyiraho ifoto igaragara neza y’igicuruzwa cyangwa ikirango.|Ajoutez une photo nette du produit ou de l’étiquette.|Pakia picha wazi ya bidhaa au lebo.
What is the medicine brand or product name?|Izina ry’ubucuruzi ry’umuti ni irihe?|Quel est le nom commercial du médicament ?|Jina la biashara la dawa ni lipi?
What is the generic name / active ingredient?|Izina rusange cyangwa ikinyabutabire gikora ni ikihe?|Quelle est la dénomination générique ou la substance active ?|Jina la kawaida au kiambato hai ni kipi?
What strength is printed on the label? For example: 500 mg or 125 mg/5 mL.|Ni iyihe ngano y’umuti yanditse ku kirango? Urugero: 500 mg cyangwa 125 mg/5 mL.|Quel dosage figure sur l’étiquette ? Par exemple : 500 mg ou 125 mg/5 mL.|Ni nguvu gani imeandikwa kwenye lebo? Kwa mfano: 500 mg au 125 mg/5 mL.
What is the dosage form?|Umuti umeze ute?|Quelle est la forme pharmaceutique ?|Dawa ina umbo gani?
What route is stated on the product label?|Ni ubuhe buryo bwo gutanga umuti bwanditse ku kirango?|Quelle voie d’administration figure sur l’étiquette ?|Ni njia gani ya kutoa dawa imeandikwa kwenye lebo?
What is the pack size? For example: 10 blisters of 10 tablets.|Ipaki irimo bingahe? Urugero: amapaki 10 arimo ibinini 10 buri rimwe.|Quel est le conditionnement ? Par exemple : 10 plaquettes de 10 comprimés.|Ukubwa wa pakiti ni upi? Kwa mfano: malengelenge 10 ya vidonge 10.
What is the batch / lot number?|Nomero y’icyiciro ni iyihe?|Quel est le numéro de lot ?|Nambari ya kundi ni ipi?
What is the manufacture date, if known?|Itariki byakoreweho ni iyihe, niba izwi?|Quelle est la date de fabrication, si connue ?|Tarehe ya utengenezaji ni ipi, ikiwa inajulikana?
What is the expiry date for this batch?|Iki cyiciro kizarangira ryari?|Quelle est la date de péremption de ce lot ?|Tarehe ya mwisho wa matumizi ya kundi hili ni ipi?
What storage conditions are printed on the label?|Ni ubuhe buryo bwo kubika bwanditse ku kirango?|Quelles conditions de stockage figurent sur l’étiquette ?|Ni masharti gani ya kuhifadhi yameandikwa kwenye lebo?
What is the recorded dispensing classification?|Ni ikihe cyiciro cyo gutanga umuti cyanditswe?|Quelle classification de délivrance est enregistrée ?|Uainishaji uliorekodiwa wa kutoa dawa ni upi?
What is the medical consumable name?|Izina ry’igikoresho cy’ubuvuzi gikoreshwa kikarangira ni irihe?|Quel est le nom du consommable médical ?|Jina la kifaa tiba kinachotumika na kuisha ni lipi?
What is the catalogue / product code?|Kode yo muri kataloge cyangwa iy’igicuruzwa ni iyihe?|Quel est le code catalogue ou produit ?|Msimbo wa katalogi au bidhaa ni upi?
What size, gauge, capacity, or dimensions identify this product?|Ni iyihe ngano, umubyimba, ubushobozi cyangwa ibipimo biranga iki gicuruzwa?|Quelles taille, jauge, capacité ou dimensions identifient ce produit ?|Ni ukubwa, geji, uwezo au vipimo gani vinavyotambulisha bidhaa hii?
What material is it made from?|Bikozwe mu ki?|De quel matériau est-il composé ?|Imetengenezwa kwa nyenzo gani?
What is its labelled sterility status?|Ikirango kivuga iki ku mikorobe?|Quel état de stérilité est indiqué sur l’étiquette ?|Lebo inaonyesha hali gani ya utasa?
What use type is stated on the label?|Ni ubuhe buryo bwo gukoresha bwanditse ku kirango?|Quel type d’utilisation figure sur l’étiquette ?|Ni aina gani ya matumizi imeandikwa kwenye lebo?
How many pieces are in each pack?|Buri paki irimo bingahe?|Combien de pièces contient chaque paquet ?|Kila pakiti ina vipande vingapi?
What is the expiry date, if applicable?|Itariki yo kurangira ni iyihe, niba ihari?|Quelle est la date de péremption, le cas échéant ?|Tarehe ya mwisho wa matumizi ni ipi, ikiwa ipo?
What storage conditions are required?|Ni ubuhe buryo bwo kubika bukenewe?|Quelles conditions de stockage sont requises ?|Ni masharti gani ya kuhifadhi yanayohitajika?
What is the biomedical equipment name?|Igikoresho cy’ubuvuzi cyitwa ngo iki?|Quel est le nom de l’équipement biomédical ?|Jina la kifaa cha biomedikali ni lipi?
What type of equipment is it? For example: patient monitor, centrifuge, or ultrasound.|Ni ubuhe bwoko bw’igikoresho? Urugero: monitori y’umurwayi, centrifuge cyangwa ultrasound.|De quel type d’équipement s’agit-il ? Par exemple : moniteur patient, centrifugeuse ou échographe.|Ni aina gani ya kifaa? Kwa mfano: kifuatiliaji cha mgonjwa, centrifuge au ultrasound.
What is the equipment model?|Moderi y’igikoresho ni iyihe?|Quel est le modèle de l’équipement ?|Modeli ya kifaa ni ipi?
What is the serial number? Use one record per serialized device.|Nomero iranga igikoresho ni iyihe? Bika buri gikoresho ukwacyo.|Quel est le numéro de série ? Créez une fiche par appareil numéroté.|Nambari ya mfululizo ni ipi? Tumia rekodi moja kwa kila kifaa chenye nambari.
What is the asset / inventory tag?|Nomero y’umutungo cyangwa iy’ububiko ni iyihe?|Quel est l’identifiant d’actif ou d’inventaire ?|Lebo ya mali au akiba ni ipi?
What is its condition?|Kimeze gute?|Quel est son état ?|Hali yake ni ipi?
What are the voltage, frequency, and power requirements?|Ni iyihe voltaji, inshuro n’ingufu z’amashanyarazi bikenewe?|Quelles sont la tension, la fréquence et la puissance requises ?|Ni volteji, masafa na nguvu gani za umeme zinazohitajika?
Which probes, cables, accessories, or manuals are included?|Ni izihe sondi, insinga, ibikoresho by’inyongera cyangwa inyandiko bijyana na cyo?|Quelles sondes, câbles, accessoires ou notices sont inclus ?|Ni vihisi, nyaya, vifaa vya ziada au miongozo gani imejumuishwa?
When was it last serviced?|Giheruka gusanwa ryari?|Quand a eu lieu le dernier entretien ?|Kilifanyiwa matengenezo lini mara ya mwisho?
When is the next service due?|Isanwa rikurikira riteganyijwe ryari?|Quand est prévu le prochain entretien ?|Matengenezo yajayo yanatakiwa lini?
When is calibration due, if applicable?|Igenzura ry’ibipimo riteganyijwe ryari, niba rikenewe?|Quand l’étalonnage est-il prévu, le cas échéant ?|Urekebishaji wa vipimo unatakiwa lini, ikiwa unahitajika?
When does the warranty end?|Garanti irangira ryari?|Quand la garantie expire-t-elle ?|Dhamana inaisha lini?
Leave this recording? Unsaved answers will be lost.|Uve muri iyi nyandiko? Ibisubizo bitabitswe biratakara.|Quitter cet enregistrement ? Les réponses non enregistrées seront perdues.|Uondoke kwenye rekodi hii? Majibu yasiyohifadhiwa yatapotea.
Let’s record one medicine and batch using its product label. These are stock details, not prescribing instructions.|Reka tubike umuti n’icyiciro dukurikije ikirango. Aya ni amakuru y’ububiko, si amabwiriza yo kuwufata.|Enregistrons un médicament et son lot d’après l’étiquette. Ce sont des données de stock, pas des instructions de prescription.|Turekodi dawa na kundi lake kwa kutumia lebo. Hizi ni taarifa za akiba, si maagizo ya matumizi ya dawa.
Let’s record the consumable specifications, pack size, and batch stock.|Reka tubike ibisobanuro, ingano y’ipaki n’ububiko bw’icyiciro.|Enregistrons les spécifications, le conditionnement et le stock du lot.|Turekodi vipimo, ukubwa wa pakiti na akiba ya kundi.
Let’s record this equipment’s identity, condition, accessories, and service information.|Reka tubike umwirondoro w’igikoresho, uko kimeze, ibijyana na cyo n’amakuru y’isanwa.|Enregistrons l’identité, l’état, les accessoires et l’entretien de cet équipement.|Turekodi utambulisho, hali, vifaa vya ziada na matengenezo ya kifaa hiki.
Choose a JPEG, PNG, or WebP photo up to 5 MB.|Hitamo ifoto ya JPEG, PNG cyangwa WebP itarengeje 5 MB.|Choisissez une photo JPEG, PNG ou WebP de 5 Mo maximum.|Chagua picha ya JPEG, PNG au WebP isiyozidi MB 5.
Enter a valid price greater than zero, with up to two decimals.|Andika igiciro kirenze zeru, gifite imibare itarenze ibiri nyuma y’akadomo.|Saisissez un prix supérieur à zéro, avec deux décimales maximum.|Weka bei iliyo juu ya sifuri yenye hadi desimali mbili.
Unable to read photo.|Ifoto ntishoboye gusomwa.|Impossible de lire la photo.|Imeshindwa kusoma picha.
Unable to save. Your answers are still here.|Kubika byanze. Ibisubizo byawe biracyahari.|Enregistrement impossible. Vos réponses sont conservées ici.|Imeshindwa kuhifadhi. Majibu yako bado yapo hapa.
Overview|Incamake|Vue d’ensemble|Muhtasari
Ask S|Baza S|Demander à S|Uliza S
Home|Ahabanza|Accueil|Mwanzo
Edit|Hindura|Modifier|Hariri
View details|Reba ibisobanuro|Voir les détails|Angalia maelezo
Workspace|Aho ukorera|Espace de travail|Eneo la kazi
Workspace navigation|Kuyobora aho ukorera|Navigation de l’espace de travail|Urambazaji wa eneo la kazi
Your workspace, at a glance|Incamake y’aho ukorera|Votre espace en un coup d’œil|Eneo lako la kazi kwa muhtasari
Choose a task. S is here to help you along the way.|Hitamo icyo gukora. S aragufasha.|Choisissez une tâche. S vous accompagne.|Chagua kazi. S yuko hapa kukusaidia.
Maintenance Help|Ubufasha mu gusana|Aide à la maintenance|Msaada wa matengenezo
Spare-Part Help|Ubufasha ku bice bisimbura|Aide pour les pièces détachées|Msaada wa vipuri
Maintenance & spare-part help|Ubufasha mu gusana no ku bice bisimbura|Aide maintenance et pièces|Msaada wa matengenezo na vipuri
Spare parts|Ibice bisimbura|Pièces détachées|Vipuri
Items for sale|Ibicuruzwa|Articles à vendre|Bidhaa za kuuza
Requests & marketplace|Ubusabe n’isoko|Demandes et marché|Maombi na soko
My account|Konti yanjye|Mon compte|Akaunti yangu
Other items|Ibindi bicuruzwa|Autres articles|Bidhaa nyingine
Find available items and get information from S.|Shaka ibicuruzwa bihari kandi ubaze S.|Trouvez les articles disponibles avec S.|Tafuta bidhaa zinazopatikana kwa msaada wa S.
Record spare parts with S.|Bika ibice bisimbura hamwe na S.|Enregistrez les pièces avec S.|Rekodi vipuri pamoja na S.
Manage equipment, prices and posted items.|Cunga ibikoresho, ibiciro n’ibyashyizwe ku isoko.|Gérez les équipements, prix et annonces.|Simamia vifaa, bei na matangazo.
Browse posted products and follow your requests.|Reba ibicuruzwa byashyizwe ku isoko n’ubusabe bwawe.|Consultez les annonces et suivez vos demandes.|Angalia bidhaa zilizotangazwa na fuatilia maombi yako.
Record maintenance work with S.|Andika ibikorwa byo gusana hamwe na S.|Enregistrez les interventions avec S.|Rekodi matengenezo pamoja na S.
Save a spare part and its asking price.|Bika igice gisimbura n’igiciro cyacyo.|Enregistrez une pièce et son prix.|Hifadhi kipuri na bei yake.
Find available products and inventory information.|Shaka ibicuruzwa n’amakuru y’ububiko.|Trouvez les produits et les informations de stock.|Tafuta bidhaa na taarifa za akiba.
Find maintenance knowledge from successful job cards.|Shaka ubumenyi mu mafishi y’isanwa ryagenze neza.|Consultez les connaissances issues des interventions réussies.|Tafuta maarifa kutoka rekodi za matengenezo yaliyofaulu.
Manage equipment and posted items.|Cunga ibikoresho n’ibicuruzwa byatangajwe.|Gérez les équipements et annonces.|Simamia vifaa na bidhaa zilizotangazwa.
Browse products and follow requests.|Reba ibicuruzwa n’ubusabe.|Parcourez les produits et suivez les demandes.|Angalia bidhaa na fuatilia maombi.
Medical consumables|Ibikoresho by’ubuvuzi bikoreshwa bikarangira|Consommables médicaux|Vifaa tiba vinavyotumika na kuisha
Biomedical equipment|Ibikoresho by’ubuvuzi|Équipements biomédicaux|Vifaa vya biomedikali
Pharmacy|Farumasi|Pharmacie|Famasi
S · Medical store|S · Ububiko bw’ubuvuzi|S · Magasin médical|S · Duka la vifaa tiba
Medical store navigation|Kuyobora ububiko bw’ubuvuzi|Navigation du magasin médical|Urambazaji wa duka la vifaa tiba
Medical inventory workspace|Aho ucungira ububiko bw’ubuvuzi|Gestion du stock médical|Usimamizi wa akiba ya vifaa tiba
Your store, at a glance|Incamake y’ububiko bwawe|Votre magasin en un coup d’œil|Duka lako kwa muhtasari
What would you like to record today?|Urashaka kubika iki uyu munsi?|Que souhaitez-vous enregistrer aujourd’hui ?|Ungependa kurekodi nini leo?
Choose a department. S will guide you through the right questions for that stock.|Hitamo icyiciro. S arakubaza ibibazo bijyanye n’ibyo ubika.|Choisissez un rayon. S posera les questions adaptées à ce stock.|Chagua idara. S atakuongoza kwa maswali yanayofaa akiba hiyo.
Stored products|Ibicuruzwa bibitswe|Produits en stock|Bidhaa zilizohifadhiwa
Posted products|Ibicuruzwa byatangajwe|Produits publiés|Bidhaa zilizotangazwa
Stock alerts|Impuruza z’ububiko|Alertes de stock|Tahadhari za akiba
Pending requests|Ubusabe butarasubizwa|Demandes en attente|Maombi yanayosubiri
Stock attention|Ibyo kwitaho mu bubiko|Points à surveiller|Akiba inayohitaji uangalizi
Expiry and reorder checks based on recorded stock details.|Igenzura ry’igihe cyo kurangira no kongera kurangura hashingiwe ku bubiko.|Contrôles des péremptions et seuils de réapprovisionnement selon le stock enregistré.|Ukaguzi wa mwisho wa matumizi na kuagiza upya kulingana na akiba iliyorekodiwa.
Loading stock…|Turimo gufungura ububiko…|Chargement du stock…|Inapakia akiba…
No expiry or reorder alerts in your recorded stock.|Nta mpuruza yo kurangira cyangwa kongera kurangura.|Aucune alerte de péremption ou de réapprovisionnement.|Hakuna tahadhari ya mwisho wa matumizi au kuagiza upya.
Showing 8 of|Herekanwa 8 muri|Affichage de 8 sur|Inaonyesha 8 kati ya
alerts. Review the inventory sections for more.|mpuruza. Reba ibyiciro by’ububiko kugira ngo ubone ibindi.|alertes. Consultez les rayons pour en savoir plus.|tahadhari. Angalia sehemu za akiba kwa zaidi.
Your inventory assistant|Umufasha wawe mu bubiko|Votre assistant de stock|Msaidizi wako wa akiba
Ask S about stored products, prices, quantities, or available medical supplies.|Baza S ibicuruzwa bibitswe, ibiciro, ingano cyangwa ibikoresho bihari.|Interrogez S sur les produits, prix, quantités ou fournitures disponibles.|Uliza S kuhusu bidhaa, bei, kiasi au vifaa tiba vinavyopatikana.
Ask S →|Baza S →|Demander à S →|Uliza S →
Products appear to clients after you post them. Review stock details before posting.|Abakiriya babona ibicuruzwa umaze kubitangaza. Banza ugenzure amakuru.|Les clients voient les produits après publication. Vérifiez les détails avant de publier.|Wateja huona bidhaa baada ya kuzitangaza. Kagua taarifa kwanza.
Expired|Igihe cyararenze|Périmé|Muda umeisha
Expires within 30 days|Birarangira mu minsi 30|Expire sous 30 jours|Inaisha ndani ya siku 30
Out of stock|Byashize mu bubiko|Rupture de stock|Akiba imeisha
Expired stock|Ibyarengeje igihe|Stock périmé|Akiba iliyopitwa na muda
Reorder level reached|Igihe cyo kongera kurangura|Seuil de réapprovisionnement atteint|Kiwango cha kuagiza upya kimefikiwa
Medical store inventory|Ububiko bw’ibikoresho by’ubuvuzi|Stock du magasin médical|Akiba ya duka la vifaa tiba
View saved inventory|Reba ububiko bwabitswe|Voir le stock enregistré|Angalia akiba iliyohifadhiwa
Save stock details|Bika amakuru y’ububiko|Enregistrer le stock|Hifadhi taarifa za akiba
Update stock details|Hindura amakuru y’ububiko|Modifier le stock|Sasisha taarifa za akiba
← Back to medical store|← Subira mu bubiko bw’ubuvuzi|← Retour au magasin médical|← Rudi dukani
Saved to|Byabitswe muri|Enregistré dans|Imehifadhiwa katika
. You can review and post it from your inventory.|. Ushobora kubireba no kubitangaza mu bubiko.|. Vous pouvez vérifier et publier depuis votre stock.|. Unaweza kukagua na kutangaza kutoka kwenye akiba yako.
Return to inventory|Subira mu bubiko|Retour au stock|Rudi kwenye akiba
Recording progress|Aho kubika bigeze|Progression de l’enregistrement|Maendeleo ya kurekodi
Product|Igicuruzwa|Produit|Bidhaa
Continue|Komeza|Continuer|Endelea
Skip|Simbuka|Passer|Ruka
Review|Genzura|Vérifier|Kagua
Change answer|Hindura igisubizo|Modifier la réponse|Badilisha jibu
Save|Bika|Enregistrer|Hifadhi
— stock details|— amakuru y’ububiko|— détails du stock|— taarifa za akiba
Stock quantity|Ingano iri mu bubiko|Quantité en stock|Kiasi cha akiba
Stock unit (box, pack, vial, unit)|Igipimo (agasanduku, ipaki, icupa, kimwe)|Unité (boîte, paquet, flacon, pièce)|Kipimo (sanduku, pakiti, chupa, kipande)
Storage location|Ahantu bibitswe|Emplacement|Mahali pa kuhifadhi
Supplier|Uwabitanze|Fournisseur|Msambazaji
Received date|Itariki byakiriweho|Date de réception|Tarehe ya kupokea
Reorder level|Ingano yo kongera kuranguriraho|Seuil de réapprovisionnement|Kiwango cha kuagiza upya
Product code|Kode y’igicuruzwa|Code produit|Msimbo wa bidhaa
Size / specification|Ingano / ibisobanuro|Taille / spécification|Ukubwa / vipimo
Material|Icyo bikozwemo|Matériau|Nyenzo
Sterility|Kutagira mikorobe|Stérilité|Hali ya kutokuwa na vijidudu
Use type|Uburyo bwo gukoresha|Type d’utilisation|Aina ya matumizi
Pack size|Ingano y’ipaki|Conditionnement|Ukubwa wa pakiti
Batch / lot number|Nomero y’icyiciro|Numéro de lot|Nambari ya kundi
Expiry date|Itariki yo kurangira|Date de péremption|Tarehe ya mwisho wa matumizi
Storage conditions|Uburyo bwo kubika|Conditions de stockage|Masharti ya kuhifadhi
Equipment type|Ubwoko bw’igikoresho|Type d’équipement|Aina ya kifaa
Asset tag|Nomero y’umutungo|Identifiant d’actif|Lebo ya mali
Power requirements|Amashanyarazi akenewe|Alimentation électrique requise|Mahitaji ya umeme
Included accessories|Ibikoresho bijyana na cyo|Accessoires inclus|Vifaa vya ziada vilivyojumuishwa
Last service|Isanwa riheruka|Dernier entretien|Matengenezo ya mwisho
Calibration due|Igihe cyo kugenzura ibipimo|Échéance d’étalonnage|Tarehe ya urekebishaji wa vipimo
Warranty end|Igihe garanti irangirira|Fin de garantie|Mwisho wa dhamana
Model|Moderi|Modèle|Modeli
Serial number|Nomero iranga igikoresho|Numéro de série|Nambari ya mfululizo
Condition|Uko kimeze|État|Hali
Next service date|Itariki y’isanwa rikurikira|Prochain entretien|Tarehe ya matengenezo yajayo
Labelled route|Uburyo bwo gutanga bwanditse ku kirango|Voie indiquée sur l’étiquette|Njia iliyoandikwa kwenye lebo
Dispensing classification|Icyiciro cyo gutanga umuti|Classification de délivrance|Uainishaji wa utoaji wa dawa
Manufacture date|Itariki byakoreweho|Date de fabrication|Tarehe ya utengenezaji
Generic medicine name|Izina rusange ry’umuti|Dénomination générique|Jina la kawaida la dawa
Strength|Ingano y’umuti ukora|Dosage|Nguvu ya dawa
Dosage form|Imiterere y’umuti|Forme pharmaceutique|Aina ya dawa
Tablet|Ikinini|Comprimé|Kidonge
Capsule|Kapisule|Gélule|Kapsuli
Oral solution|Umuti w’amazi unyobwa|Solution buvable|Dawa ya maji ya kunywa
Suspension|Umuti uvangavanze w’amazi|Suspension|Dawa ya mchanganyiko wa maji
Injection|Umuti uterwa|Injection|Sindano
Cream / ointment|Umuti wo gusiga|Crème / pommade|Krimu / marhamu
Drops|Umuti w’ibitonyanga|Gouttes|Matone
Inhaler|Igikoresho cyo guhumeka umuti|Inhalateur|Kivutio cha dawa
Powder|Ifu|Poudre|Unga
Other|Ikindi|Autre|Nyingine
Prescription required|Bisaba urupapuro rwa muganga|Sur ordonnance|Inahitaji agizo la daktari
Non-prescription|Ntibisaba urupapuro rwa muganga|Sans ordonnance|Bila agizo la daktari
Sterile|Nta mikorobe|Stérile|Bila vijidudu
Non-sterile|Ntibyasukuweho mikorobe|Non stérile|Isiyo tasa
Single-use|Bikoreshwa rimwe|Usage unique|Matumizi ya mara moja
Reusable|Byongera gukoreshwa|Réutilisable|Inaweza kutumika tena
New|Gishya|Neuf|Mpya
Used - working|Cyakoreshejwe ariko kirakora|D’occasion, fonctionnel|Imetumika, inafanya kazi
Refurbished|Cyavuguruwe|Reconditionné|Imekarabatiwa
Needs repair|Gikeneye gusanwa|À réparer|Inahitaji matengenezo
For parts|Ibyo gukuramo ibice|Pour pièces|Kwa vipuri
`;
export const workspaceTranslations = Object.fromEntries(rows.trim().split('\n').map(row => {
  const [en, rw, fr, sw] = row.split('|')
  return [en, { rw, fr, sw }]
}))
