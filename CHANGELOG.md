# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.4.0](https://github.com/usertopio/otod-durian-lab1/compare/v2.3.1...v2.4.0) (2025-09-25)


### 🐛 Fixes

* **cron:** 🐛update SCHEDULE_1340 time configuration ([cbc4755](https://github.com/usertopio/otod-durian-lab1/commit/cbc47554a299385c862920545eb1f4d532b0ec9b))
* **cron:** 🐛update SCHEDULE_1340 time configuration ([242a79f](https://github.com/usertopio/otod-durian-lab1/commit/242a79f14875b8261e69b4322cc72f4c79d3d0a7))


### ✨ Features

* **api)(communities:** ✨sync communities data from API to database ([09e1ad3](https://github.com/usertopio/otod-durian-lab1/commit/09e1ad3cef5f2978102373329cf494c7c3236e2c))
* **api:** ✨remove location ref ([6b797c5](https://github.com/usertopio/otod-durian-lab1/commit/6b797c52d6a0cef9822d224d1a1c06388b819de6))
* **farmers:** ✨remove reference of farmers ([c1950c4](https://github.com/usertopio/otod-durian-lab1/commit/c1950c4a8230f412123383654253c6124ca7744b))


### 🧹 Chore

* **cron:** 🔄update scheduled tasks initialization message ([3b4c46c](https://github.com/usertopio/otod-durian-lab1/commit/3b4c46cff6b6537307ef2b1217c0be7dff258bd6))
* **cron:** 🔥remove commented-out schedule configuration ([321ff2a](https://github.com/usertopio/otod-durian-lab1/commit/321ff2a4cf38794f32607ee426529e4f643cfa12))
* **docker:** 🐳 fix container name in docker-compose.yml ([e1414cc](https://github.com/usertopio/otod-durian-lab1/commit/e1414cc664091ff98879dedc724edaa464d98189))
* **docker:** 🐳 update Docker configuration for app service ([dac63d8](https://github.com/usertopio/otod-durian-lab1/commit/dac63d818e09f763284dd72d42cceabe58b05954))
* **docker:** 🐳 update image and container name to v2.3.1 ([cb28c53](https://github.com/usertopio/otod-durian-lab1/commit/cb28c53c35b76ce274d6525a56948a160ff88588))
* **merchants:** 🔊 add connectionDB log for debugging ([9434d6a](https://github.com/usertopio/otod-durian-lab1/commit/9434d6a20c5ce2c7af8fb9f522bd059c09dd10ff))


### ♻️ Refactor

* **api)(substance:** ♻️ enhance getSubstanceUsageSummaryByMonth with retry logic ([dec24d7](https://github.com/usertopio/otod-durian-lab1/commit/dec24d7bafc15fa7a3fc34d6da6ac7838583a387))
* **cron:** ♻️ update scheduled task time to 5:00 AM daily ([67c8b78](https://github.com/usertopio/otod-durian-lab1/commit/67c8b78fddc55d854b3e6f736feb975582a9da47))
* **cron:** ♻️update schedule configuration for clarity ([2f145f8](https://github.com/usertopio/otod-durian-lab1/commit/2f145f8dbdf020b036e74fea0029c74105d9f9ff))
* **cron:** 🔥remove commented-out SCHEDULE_1340 configuration ([a58a397](https://github.com/usertopio/otod-durian-lab1/commit/a58a397dd226eef096785726126eca09c51e681b))
* **db)(communities:** ♻️ streamline communities service and database operations ([95b0fe5](https://github.com/usertopio/otod-durian-lab1/commit/95b0fe55afa84a50334c027dce79d497ffc8ec78))
* **db)(communities:** ♻️update community reference fields for consistency ([80a074f](https://github.com/usertopio/otod-durian-lab1/commit/80a074f2b5fec1ae470055ca52726dd83f6a552d))
* **db)(durianGardens:** ♻️ reorganize code structure and remove redundant comments ([093b1b3](https://github.com/usertopio/otod-durian-lab1/commit/093b1b309cfe8d2cfb91746a4bcbdb3ac7dd4d86))
* **db)(durianGardens:** ♻️ streamline data fetching and processing logic ([78ff2be](https://github.com/usertopio/otod-durian-lab1/commit/78ff2be5a998b4da1448366de2bc9bf2244b143c))
* **db)(farmers:** ♻️remove unused reference code functions and streamline farmers processing ([19e780e](https://github.com/usertopio/otod-durian-lab1/commit/19e780ebd43bfaca8dd4db83f6707435356825c7))
* **db)(merchants:** ♻️ remove unused reference code and streamline merchant processing ([6e28ba5](https://github.com/usertopio/otod-durian-lab1/commit/6e28ba5898ff958b47763feb74ab6fd05c3d852e))
* **db)(news:** ♻️ remove bulk reference code processing functions ([5d5a6ee](https://github.com/usertopio/otod-durian-lab1/commit/5d5a6ee90970a4ae9cf17f2ab88a4306c24aec5b))
* **db)(news:** ♻️ update news group handling in bulk insert logic ([f68d970](https://github.com/usertopio/otod-durian-lab1/commit/f68d97091db9c6ffa2100332258c9a932929a821))
* **db)(news:** ♻️update province field in bulkInsertOrUpdateNews function ([5a649d4](https://github.com/usertopio/otod-durian-lab1/commit/5a649d41e64c83938320845c348443a8053f0d6d))
* **db)(price:** ♻️ update breed reference handling in price processing ([566dfb0](https://github.com/usertopio/otod-durian-lab1/commit/566dfb09d5c1934c6eb9976a78d263dd757db76f))
* **db)(price:** ♻️ update table references in price processing services ([d72957c](https://github.com/usertopio/otod-durian-lab1/commit/d72957c94875cfeeca914821a2428c74740f9c97))
* **db)(substance:** ♻️update province field in bulkInsertOrUpdateOperations function ([9f81948](https://github.com/usertopio/otod-durian-lab1/commit/9f819481ae406b91b42995b62cfb225249ae8fe3))
* **db)(substance:** ♻️update province field in bulkInsertOrUpdateSubstances and bulkProcessReferenceCodes functions ([4b43aa5](https://github.com/usertopio/otod-durian-lab1/commit/4b43aa5df61092e33500b6dc24a6b19510ab21bd))
* **db)(substance:** ♻️update region field in bulkInsertOrUpdateAvgPrice and substanceDb functions ([cd4200e](https://github.com/usertopio/otod-durian-lab1/commit/cd4200e7d47695a24de66ab8851919fa1041f11e))
* **db)(water:** ♻️ remove unused reference code processing functions ([822536d](https://github.com/usertopio/otod-durian-lab1/commit/822536d2cb7fe2a1bca228401d778465c287445c))
* **db)(water:** ♻️update province handling in bulkInsertOrUpdateWater function ([7de8e05](https://github.com/usertopio/otod-durian-lab1/commit/7de8e0566e9967bf6979e778156f76ea4a0b8b51))
* **db:** ♻️update avgPrice data mapping for consistency ([0539ee2](https://github.com/usertopio/otod-durian-lab1/commit/0539ee2800fbcbd131c50c0ea17014da6b6d0304))
* **db:** ♻️update landType field for consistency ([6fed1d9](https://github.com/usertopio/otod-durian-lab1/commit/6fed1d9a8ed0d4f8c321ee63578677247de8aa20))
* **merchants:** ♻️ remove debug log for connectionDB in resetOnlyMerchantsTable ([0ff1d04](https://github.com/usertopio/otod-durian-lab1/commit/0ff1d04bcab1c9e27af68df70f372b37e903b1b6))
* **merchants:** ♻️ update database connection usage in processors ([cb7e6fe](https://github.com/usertopio/otod-durian-lab1/commit/cb7e6fe9948905705d9936f5d47ba2b87ec03600))
* **substance:** ♻️ streamline data fetching and processing in SubstanceProcessor ([acfcf78](https://github.com/usertopio/otod-durian-lab1/commit/acfcf78e128c32f95fb3f0a70b5e63293a966213))
* **substance:** ♻️ streamline substance processing and enhance logging ([a1d7a1a](https://github.com/usertopio/otod-durian-lab1/commit/a1d7a1afbe9b98d68790b7ec291bb92f3004bf3c))


### 📝 Docs

* **readme:** 📝 update README for version 2.3.2 and improve links ([a31c61f](https://github.com/usertopio/otod-durian-lab1/commit/a31c61f247e307ae48b7b031d20914c822bceec9))

## [2.4.0](https://github.com/usertopio/otod-durian-lab1/compare/v2.2.0...v2.4.0) (2025-09-15)


### 🧹 Chore

* **package:** 🔧update project metadata and structure ([061f97a](https://github.com/usertopio/otod-durian-lab1/commit/061f97a7c5b7e00a5a62c400ecad6fd102faa609))


### 🐛 Fixes

* **db)(water:** 🛠️ streamline water records bulk insert process ([08e7458](https://github.com/usertopio/otod-durian-lab1/commit/08e74584fa5285112cf1e77b7d09806ef3ef86ff))


### ✨ Features

* **cronUtils:** ✨ run every 1.5 min ([b721383](https://github.com/usertopio/otod-durian-lab1/commit/b7213834cf945d1891e8fbaef3706d01cde031a3))
* **price)(esm:** ✨add avg price fetching and processing functionality ([07dc767](https://github.com/usertopio/otod-durian-lab1/commit/07dc76785b3f72eb0fdb8ae84c3c3f7d1de1020c))
* **price:** ✨implement avg price fetching and processing service ([79ff50b](https://github.com/usertopio/otod-durian-lab1/commit/79ff50b1a1859eebabdd2b36d28230a4d841e84f))
* **price:** ✨refactor avg price fetching to use date range chunks ([e0f6ffa](https://github.com/usertopio/otod-durian-lab1/commit/e0f6ffad92cbcc98686317417a7c4fd806636d87))


### ♻️ Refactor

* **config:** 🐳add Docker configuration files ([9fe759f](https://github.com/usertopio/otod-durian-lab1/commit/9fe759fc352cce0da9795f5bf689a8716c1dd782))
* **config:** 🐳update Docker configuration for backend service naming ([f702a18](https://github.com/usertopio/otod-durian-lab1/commit/f702a18f020ba0ddbfbd3c330d156889d5c3ad53))
* **config:** 🐳update Docker configuration for clarity and consistency ([69cbc30](https://github.com/usertopio/otod-durian-lab1/commit/69cbc30507e1fef66e1c8a1f1298f363b3b9ca26))
* **constants:** 🎨export constants for better module usage ([760cbcb](https://github.com/usertopio/otod-durian-lab1/commit/760cbcba502a88865b855303c0c9cd6d53dc659b))
* **controllers:** 🎨migrate to ES6 module syntax for improved consistency ([324c189](https://github.com/usertopio/otod-durian-lab1/commit/324c189bb4f2696664612ae2af3d420f3bf0e462))
* **cronService:** ♻️ update scheduled task interval to 1 minute and 30 seconds ([08d2523](https://github.com/usertopio/otod-durian-lab1/commit/08d2523608ed3d3d0053f6b1472447e8fce9ab29))
* **cronService:** 🎨improve code formatting and logging consistency ([cc3712a](https://github.com/usertopio/otod-durian-lab1/commit/cc3712a000a710b84b28160f64d4d3c36ce657a7))
* **db)(communities:** ♻️ export bulk process functions for communities management ([f05ca22](https://github.com/usertopio/otod-durian-lab1/commit/f05ca2212cd801a28495a9b7ee9cd3d10e9f83da))
* **db)(communities:** ♻️ streamline timestamp handling and improve code consistency ([da34ca3](https://github.com/usertopio/otod-durian-lab1/commit/da34ca3d871b8e8f80bf1e1628a87f47c8a23a6b))
* **db)(crops:** ♻️ unify timestamp handling and streamline bulk operations ([3e9189b](https://github.com/usertopio/otod-durian-lab1/commit/3e9189b853c5a3c79656769b7cff88aeaf139ed4))
* **db)(durain_gardens:** ♻️ unify timestamp handling with getBangkokTime function ([5090d6e](https://github.com/usertopio/otod-durian-lab1/commit/5090d6e9b5791e43ebba956dd35fc23310332edc))
* **db)(farmers)(func:** ♻️ improve bulkEnsureRefCodes and bulkInsertOrUpdateFarmers functions ([ea5a917](https://github.com/usertopio/otod-durian-lab1/commit/ea5a917f847c31a33c83cc00ad1c04ed092f3544))
* **db)(gap:** ♻️ unify timestamp handling with getBangkokTime function ([2669444](https://github.com/usertopio/otod-durian-lab1/commit/2669444c5f021dd38cbbb6c64e50dc9cc3823664))
* **db)(merchants:** ♻️ unify timestamp handling and streamline code ([e3c0ecf](https://github.com/usertopio/otod-durian-lab1/commit/e3c0ecf856e2dd1e7cc975c368f9010e8901e990))
* **db)(news:** ♻️ streamline bulk reference code processing and error handling ([dabda1c](https://github.com/usertopio/otod-durian-lab1/commit/dabda1c532ac26f66ded5f9eb52cf04d5ed3975e))
* **db)(news:** ♻️ unify timestamp handling and streamline bulk operations ([dbdb696](https://github.com/usertopio/otod-durian-lab1/commit/dbdb696bd960690cd21f81c3c3b5fd0e2da8550e))
* **db)(operations:** ♻️ export bulkProcessReferenceCodes and bulkInsertOrUpdateOperations functions ([c95c0ac](https://github.com/usertopio/otod-durian-lab1/commit/c95c0acedaf3fc189e1c51d3afc327d516e7b591))
* **db)(operations:** ♻️ improve variable scoping and result handling in bulkInsertOrUpdateOperations ([0d2afe3](https://github.com/usertopio/otod-durian-lab1/commit/0d2afe37169ed7733283ca3d1194705c85ff450c))
* **db)(operations:** ♻️ unify timestamp handling with getBangkokTime function ([1fe18ce](https://github.com/usertopio/otod-durian-lab1/commit/1fe18cee36a9662b8ff7a4acdeb0e86207dbbe60))
* **db)(operations:** 🔥remove unused operations count and reset functions ([7673d0d](https://github.com/usertopio/otod-durian-lab1/commit/7673d0d31bb88bd263d1ce914a992d53a4f470b9))
* **db)(substance:** ♻️ unify timestamp handling and streamline bulk operations ([e5cb0ce](https://github.com/usertopio/otod-durian-lab1/commit/e5cb0ce94e89fee053cf8107063189c7c06b7b80))
* **db)(water:** ♻️ unify timestamp handling and streamline bulk operations ([c85c2dc](https://github.com/usertopio/otod-durian-lab1/commit/c85c2dc5a574f6f0059319e0e8872a5b3e9d0fc5))
* **db:** ♻️ restructure bulk process reference codes for crops, farmers, and merchants ([d43a401](https://github.com/usertopio/otod-durian-lab1/commit/d43a401bf7c66c15d545d78fedfb7000bd67d042))
* **db:** ♻️ streamline bulk data processing across multiple database services ([b41e5e6](https://github.com/usertopio/otod-durian-lab1/commit/b41e5e6ddc663161c52f06323d3b21e995f37c1d))
* **db:** ♻️ unify timestamp handling across modules ([8a99a2f](https://github.com/usertopio/otod-durian-lab1/commit/8a99a2f6b565b05edfc3b6ad58477b21f35aeedf))
* **docker:** 🐳 update Docker configuration for backend service ([21a7e2e](https://github.com/usertopio/otod-durian-lab1/commit/21a7e2e22d3145cc2c5fee638632c683ac6ef07f))
* **gap:** ♻️ remove unused bulk reference code processing functions ([9628e80](https://github.com/usertopio/otod-durian-lab1/commit/9628e80e512f9ae67d2f1677639f3ecac8cf3013))
* **gap:** ♻️ streamline bulk insert/update process for GAP certificates ([8563efa](https://github.com/usertopio/otod-durian-lab1/commit/8563efa510577786ec4c407d6d7c7b5dd645b12e))
* **price:** ♻️ pass the whole result object to the logger ([30c46c8](https://github.com/usertopio/otod-durian-lab1/commit/30c46c8006fb4eeb853a8827eb0cd7ad7b9e7754))
* Remove unnecessary comments and improve code clarity across services ([9ec844b](https://github.com/usertopio/otod-durian-lab1/commit/9ec844b4975a1f056e0d5db209c0e84953f3ae24))
* **routes:** 🎨migrate to ES6 module syntax for improved consistency ([bf57f8d](https://github.com/usertopio/otod-durian-lab1/commit/bf57f8da5bea0c9fff576ae2bbb692abcf69a570))
* **server:** 🎨update PORT assignment for consistency ([ab5be0e](https://github.com/usertopio/otod-durian-lab1/commit/ab5be0e2ec4329936b0ca89ae8ef8db6c242353f))
* **services)(communities:** ♻️ streamline community count retrieval and enhance service layer usage ([9a05af9](https://github.com/usertopio/otod-durian-lab1/commit/9a05af92763fba73c832216a5c3cc393ced8eed6))
* **services)(communities:** ♻️implement bulk processing for community records and optimize reference code handling ([2dcbc48](https://github.com/usertopio/otod-durian-lab1/commit/2dcbc4850aecee2ea69f7ac135b10c44ef6e3cf7))
* **services)(crops:** ♻️ streamline bulk reference code processing and enhance error handling ([c182945](https://github.com/usertopio/otod-durian-lab1/commit/c182945788c439bea9e4d9a4c297effc869cf84f))
* **services)(crops:** ♻️ streamline crop count retrieval and remove unused functions ([25ac1e0](https://github.com/usertopio/otod-durian-lab1/commit/25ac1e07b40d38e65140a953df74fde5443c113b))
* **services)(crops:** ♻️ use nullish coalescing for crop properties to preserve zero values ([9a490ad](https://github.com/usertopio/otod-durian-lab1/commit/9a490ade3c3ce9f115eb788a1b1277b6c40470c0))
* **services)(crops:** ♻️ use nullish coalescing for crop properties to preserve zero values ([d409484](https://github.com/usertopio/otod-durian-lab1/commit/d40948454b3f43e2745268a98b0242fa1a43eb82))
* **services)(crops:** ♻️implement bulk processing for crop records and optimize reference code handling ([a1439ff](https://github.com/usertopio/otod-durian-lab1/commit/a1439ff18030abe978e47a2549358d33b7e93422))
* **services)(crops:** ♻️optimize crop data processing and improve rate limiting ([17461a7](https://github.com/usertopio/otod-durian-lab1/commit/17461a7894a894a934d33670ff666730d676e0f9))
* **services)(db:** ♻️ streamline bulk reference code processing and improve database interactions ([4b05625](https://github.com/usertopio/otod-durian-lab1/commit/4b05625880d8ae630af50e1158de1df6bb5526a9))
* **services)(db:** ♻️ update district and subdistrict name columns for consistency ([0b9f7b0](https://github.com/usertopio/otod-durian-lab1/commit/0b9f7b000044303769d679cb28857a13035a660c))
* **services)(durianGardens:** ♻️fix reference code processing and ensure rec_id generation ([a4d33b9](https://github.com/usertopio/otod-durian-lab1/commit/a4d33b9bc9d81ba098a82ac7edf5a4cd0fcbcb3b))
* **services)(durianGardens:** ♻️implement bulk processing for durian gardens and optimize database operations ([4e17cfc](https://github.com/usertopio/otod-durian-lab1/commit/4e17cfc55644941d69ebea09b0a44752d4434c1f))
* **services)(durianGardens:** ♻️optimize bulk operation handling for durian gardens ([0c3429b](https://github.com/usertopio/otod-durian-lab1/commit/0c3429b907392025b2c797484da49e0a4c8d2c36))
* **services)(durianGardens:** ♻️simplify fetchAllDurianGardens logic and improve data handling ([fed9f5a](https://github.com/usertopio/otod-durian-lab1/commit/fed9f5a2b6db092668f61ddb080af2928df2a433))
* **services)(farmers:** ♻️ update farmer data handling to preserve null values ([090e1f6](https://github.com/usertopio/otod-durian-lab1/commit/090e1f63364b3aae9234da916f3f2f5c7591de4e))
* **services)(farmers:** ♻️implement bulk insert/update for farmers processing ([5f06896](https://github.com/usertopio/otod-durian-lab1/commit/5f06896bf76be26285e6af152faba4401e0efc49))
* **services)(farmers:** ♻️implement bulk processing for reference codes and optimize farmer data insertion ([cdb2df4](https://github.com/usertopio/otod-durian-lab1/commit/cdb2df40b8dfb18d847ac8d37d2b3b9fc48c3451))
* **services)(farmers:** ♻️remove unused reference code functions and streamline farmer processing ([55d4b19](https://github.com/usertopio/otod-durian-lab1/commit/55d4b195e6607d9e2413006514729cdb5fa6d75f))
* **services)(gap:** ♻️implement bulk processing for GAP certificates and optimize database interactions ([1087f89](https://github.com/usertopio/otod-durian-lab1/commit/1087f89dd624f06cc529d84ba8fa32f5bdf8057b))
* **services)(merchants:** ♻️implement bulk processing for merchant records and optimize reference code handling ([0073f14](https://github.com/usertopio/otod-durian-lab1/commit/0073f14bb32bb852c8446e26fc8d9e0191195e47))
* **services)(news:** ♻️implement bulk processing for news records and optimize database interactions ([8ad2982](https://github.com/usertopio/otod-durian-lab1/commit/8ad298290e9b4afd2b5e6c2f592037b9f25694d8))
* **services)(operations:** ♻️ streamline bulk reference code processing and enhance error handling ([b974aad](https://github.com/usertopio/otod-durian-lab1/commit/b974aad55df58bb62a5d1ab6a1873ee40f822a30))
* **services)(operations:** ♻️implement bulk processing for operations and optimize data handling ([570e1bc](https://github.com/usertopio/otod-durian-lab1/commit/570e1bccc076ec08214112859c3a03d12403b097))
* **services)(substance:** ♻️implement bulk processing for substance records and optimize database interactions ([00a15ba](https://github.com/usertopio/otod-durian-lab1/commit/00a15ba1e4d79817aae50872314f21fc9787af5e))
* **services)(water:** ♻️implement bulk processing for water records and optimize database interactions ([b12493f](https://github.com/usertopio/otod-durian-lab1/commit/b12493f2eaebdea97b9e35082501bc59c7f1a61a))
* **services:** ♻️ standardize comments and improve consistency in bulk processing logs ([5bb6c3b](https://github.com/usertopio/otod-durian-lab1/commit/5bb6c3b9cf64e95d5a907dc9ede6dbd55a20fd23))
* **services:** ♻️remove redundant fetch methods and streamline data processing ([39cddfd](https://github.com/usertopio/otod-durian-lab1/commit/39cddfd391bbe717f1545d5350b1812472e12b9f))
* **services:** 🎨migrate database files to ES6 module syntax ([045eaee](https://github.com/usertopio/otod-durian-lab1/commit/045eaee1b83ab58b235cc332b3f7eec44ab146e6))
* **services:** 🎨migrate farmersDb to ES6 module syntax and update farmer handling ([0442ba5](https://github.com/usertopio/otod-durian-lab1/commit/0442ba5133e2b5ff8699ad6a2ee5314cb26044f8))
* **services:** 🎨migrate farmersProcessor to ES6 module syntax ([3c5974b](https://github.com/usertopio/otod-durian-lab1/commit/3c5974b9e718a677326f56ad436e9223764c86f7))
* **services:** 🎨migrate to ES6 module syntax for improved consistency ([7c4f15b](https://github.com/usertopio/otod-durian-lab1/commit/7c4f15bee015d02c513e639f621319559cd086a5))


### 📝 Docs

* **README:** 📝 update project description and improve formatting ([7396304](https://github.com/usertopio/otod-durian-lab1/commit/739630490bc89d2c51596c0b74fd266e037afb60))

## [2.3.0](https://github.com/usertopio/otod-durian-lab1/compare/v2.2.0...v2.3.0) (2025-09-15)


### ♻️ Refactor

* **cronService:** 🎨improve code formatting and logging consistency ([cc3712a](https://github.com/usertopio/otod-durian-lab1/commit/cc3712a000a710b84b28160f64d4d3c36ce657a7))

## [2.2.0](https://github.com/usertopio/otod-durian-lab1/compare/v2.1.0...v2.2.0) (2025-09-04)


### 📝 Docs

* 📝add LICENSE file and update README for licensing information ([bab9f5a](https://github.com/usertopio/otod-durian-lab1/commit/bab9f5a059978e1e37214fe7dd35260e2868dfdc))


### ✨ Features

* **api:** ✨add community, crops, durian gardens, farmers, gap, merchants, news, operations, substance, token, and water controllers ([6fe364f](https://github.com/usertopio/otod-durian-lab1/commit/6fe364ffaca7f6f7671766bf65dcd80682ebff67))
* **api:** ✨refactor API client and login service for improved structure ([cbaff7d](https://github.com/usertopio/otod-durian-lab1/commit/cbaff7d235d3b83513e761b8f0ebd23d2c68af58))
* **auth:** ✨add token management and API endpoints ([a74bd80](https://github.com/usertopio/otod-durian-lab1/commit/a74bd80ee8031f471f3f1e878edc797bf4203894))
* **cron:** ⚠️add cron service for scheduled data fetching ([233b21c](https://github.com/usertopio/otod-durian-lab1/commit/233b21ccda8d8ef0d73373dcee8c743f5097d867))
* **cron:** ✨add SCHEDULES_CONFIG for dynamic cron scheduling ([a14dfd8](https://github.com/usertopio/otod-durian-lab1/commit/a14dfd82e99a50e5d4fd9930fb8d6fb7a7ad85d4))
* **cron:** ✨enhance cron service with improved error handling and logging ([d25e1ba](https://github.com/usertopio/otod-durian-lab1/commit/d25e1ba34b4ecd8aa47850205a801810a8b3cf73))
* **cron:** ✨enhance cron service with improved logging and error handling ([d9fa82a](https://github.com/usertopio/otod-durian-lab1/commit/d9fa82a6130e5523f415cd59b03c8c031a2a27a6))
* **cron:** ✨improve data fetching schedule and execution control ([0658fb0](https://github.com/usertopio/otod-durian-lab1/commit/0658fb0be3ba336908c457af624a7840340b1f40))
* **cron:** ✨update cron scheduling with validation and multiple expressions ([8741850](https://github.com/usertopio/otod-durian-lab1/commit/8741850e7a19709db78b8c97aa212e89b79c7b92))
* **cron:** ✨update data fetching schedule to every 1 minute (start at any second) ([eeed8dc](https://github.com/usertopio/otod-durian-lab1/commit/eeed8dc54bad8519ad645765327f42882ebe2038))
* **deps:** ➕add node-cron dependency for task scheduling ([be7ccb9](https://github.com/usertopio/otod-durian-lab1/commit/be7ccb9c1e44067b9cc230c89855ce7b3e1aa6c1))


### ♻️ Refactor

* **api:** 🔥remove unused custom headers from farmers API request ([f39b108](https://github.com/usertopio/otod-durian-lab1/commit/f39b108917d67f432f6f6336b3c13be81bb6e34d))
* **api:** 🔥remove unused custom headers from getCrops API request ([20de1c2](https://github.com/usertopio/otod-durian-lab1/commit/20de1c21a05d3a2ab6981998d5421dd09ce4e100))
* **api:** 🔥remove unused custom headers from GetLands and GetLandGeoJSON API requests ([8d9bd86](https://github.com/usertopio/otod-durian-lab1/commit/8d9bd86f57aa81879a68e1746801cccbcddc92fa))
* **api:** 🔥remove unused custom headers from getMerchants API request ([52b83a6](https://github.com/usertopio/otod-durian-lab1/commit/52b83a66693700b599e68273b54f8c2a434d6967))
* **api:** 🔥remove unused custom headers from getNews API request ([ca50fb9](https://github.com/usertopio/otod-durian-lab1/commit/ca50fb98c682e62ae48644f404056d40119f966b))
* **api:** 🔥remove unused custom headers from operations API request ([71aa423](https://github.com/usertopio/otod-durian-lab1/commit/71aa4235a07b4c668d7b8b8a8e8afadf79cc7d52))
* **api:** 🔥remove unused custom headers from substance API request ([c9928b6](https://github.com/usertopio/otod-durian-lab1/commit/c9928b6ba63503175f058f19f613df7e9c0778f1))
* **api:** 🔥remove unused custom headers from water API request ([5b0ecb3](https://github.com/usertopio/otod-durian-lab1/commit/5b0ecb37b77323dae8c53ba43324236d89c128d9))
* **auth:** 🔍remove debug logging for login response ([f1af26f](https://github.com/usertopio/otod-durian-lab1/commit/f1af26fac84783a4aa60a3e4c93234c7cf587b8d))
* **cron:** ♻️improve logging consistency and formatting ([fa97003](https://github.com/usertopio/otod-durian-lab1/commit/fa97003d741c921e1c9d2efa448e2107a030c3af))
* **cron:** ♻️improve sequential data fetching logic ([13a0087](https://github.com/usertopio/otod-durian-lab1/commit/13a00873ea18d4d5c1906b87d6f5caa4b40dbf57))
* **cron:** ♻️update cron schedules for clarity and consistency ([f1acb43](https://github.com/usertopio/otod-durian-lab1/commit/f1acb439f25d445c6febb9669890323b1e165aa1))
* **crops:** 🔥remove unused custom headers for GetCrops API request ([9391cf4](https://github.com/usertopio/otod-durian-lab1/commit/9391cf4220f1bf6f5b6484016b9ab9fd5e20b791))
* **server:** ♻️remove debug logging for environment variables ([0976cb6](https://github.com/usertopio/otod-durian-lab1/commit/0976cb6df75c22b2dcc341231297230656c01de4))


### 🧹 Chore

* **config:** 🔧update repository URL in package.json ([242c274](https://github.com/usertopio/otod-durian-lab1/commit/242c2743960891411e20dc29465fc8d846c86a07))
* **release:** merge release/V2.2.0 into main ([965618e](https://github.com/usertopio/otod-durian-lab1/commit/965618e6af78ce44a8bb2b697a271f4d88f2fbd4))

## [2.1.0](https://github.com/usertopio/otod-durian-lab1/compare/v2.0.0...v2.1.0) (2025-08-29)

### 📝 Docs

- **README:** 📝update project description and fix minor formatting issues ([1afbe79](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/1afbe79ab19d0b1488570ba74a197f3c02caf675))

### ✨ Features

- **api:** ✨fetch crop harvests by year for improved data retrieval ([415ecd5](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/415ecd5388c5b2ad46f987cb28e9aa1530781497))
- **api:** ✨refactor operations data fetching to support multiple years ([edbf77f](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/edbf77f03d79df0b44483959bf2f4fd3139050e8))
- **crops:** ✨enhance GetCrops API fetching to support multiple years ([3281564](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/3281564f60226d1d625778d05733574c8380c2d9))
- **crops:** ✨update GetCropHarvests API fetching to support pagination ([049c863](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/049c8634f3d5d6eafe0197bb27f6400e7d18962f))
- **db:** 🗃️add province mapping to operation records ([647825b](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/647825bb91dd0f7b70b9992ae30017caeecc02c1))
- **db:** 🗃️refactor community, merchant, news, and operation insert/update logic for clarity and efficiency ([0d00680](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/0d006801b00e022fc42ba082f1827549161975b3))
- **db:** 🗃️refactor crop insert/update logic for clarity and efficiency ([ea83c3c](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/ea83c3c1da781e66e996c47a67d3dd0d8524e95a))
- **db:** 🗃️refactor insert/update logic for durian gardens and farmers ([ebddf08](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/ebddf08427cf6668614d1613269ae8764b89a1d3))
- **db:** 🗃️refactor operation type handling for clarity and efficiency ([0577328](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/0577328f4c612c856d44a8c747b06b75c4531986))
- **substance:** ✨fetch substance data for multiple years ([1b2d981](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/1b2d98141b3c9a8afae9179e47e983c75392f1f0))
- **water:** ✨refactor water data fetching to support multiple years ([cd05fca](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/cd05fca707e34176afe4df825c9227836f82c148))

### ♻️ Refactor

- **api:** ♻️standardize error handling and logging for API requests ([526bbb1](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/526bbb18d716f888a3464a65164b0c1508533fe1))
- **communities:** ♻️enhance logging for API page info with year context ([38ea240](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/38ea2405d3e9e57617bb5c22c07378a1c115ab49))
- **communities:** ♻️rename fetch method for clarity ([87cf0a3](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/87cf0a3600c0459992c7c0a3c3afd736f234676b))
- **communities:** ♻️simplify communities fetching logic ([f3d1966](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/f3d196632235679748c0c17e3258dac9b7147f5c))
- **communities:** ♻️simplify fetch and process logic ([2e98076](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/2e98076040456c041d225f3e5cbe20751742f93a))
- **communitiesProcessor, durianGardensProcessor, gapProcessor, merchantsProcessor, newsProcessor:** ♻️standardize pagination logic for data fetching ([fd5f31b](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/fd5f31baaf6b93591ffb83854dccbb011c17ffef))
- **constants:** ♻️remove unused target count and total records from config ([e3f9790](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/e3f97900648e2d3469e231d6a106cecac27ef481))
- **constants:** ♻️standardize total records for Durian Gardens config ([09a59ae](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/09a59aee7f37bf3f34c2d64b2928aa8776c2bbc5))
- **crops, operations:** ♻️simplify pagination logic and improve logging ([1e0aaaa](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/1e0aaaa0d2baccfba973f25eb833efece3130e3e))
- **crops:** ♻️simplify crops fetching logic and improve error handling ([99b5807](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/99b58070ba6a749abc2aa5a8ce87277d82400792))
- **crops:** ♻️standardize logging for page info with year context ([a623ebc](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/a623ebcbf42e8fe17d26e67b69f68be2f4607028))
- **cropsProcessor, cropsDb:** ♻️add ensureRefCode function for breedId resolution ([1909d62](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/1909d627eb3564fe58f87b58c8e7df275c6e222b))
- **cropsProcessor, cropsDb:** ♻️enhance crop upsert logic with durianStageId resolution ([39d6d94](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/39d6d94f78ce60211f9f9ba82050243498c781f9))
- **cropsProcessor:** ♻️standardize date range for crop data fetching ([db2aa38](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/db2aa38dae859e047aabde76f26a0c24f0d7c27b))
- **db:** ♻️improve reference code generation logic (remove "NG") ([91c95f3](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/91c95f3b4f9bcf5cd0048431937238baa8a93974))
- **db:** ♻️remove duplicate ensureRefCode function and streamline code ([4faad32](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/4faad32cc9082a4fa0fe5a62b4925118e45b58bb))
- **db:** ♻️standardize ensureRefCode implementation across modules ([958834b](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/958834b1ee7b97d28f14607121ebfddc878e6644))
- **durianGardens:** ♻️simplify durian gardens fetching logic and improve error handling ([e7af418](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/e7af418e084aa559c8ef61d0d931e2245066a6e0))
- **durianGardens:** ♻️standardize logging for page info with year context ([88394a4](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/88394a4c2f4de3218d18efea15dc8aee467ef028))
- **durianGardensProcessor:** ♻️update logging to include flattened lands data ([ca59553](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/ca5955341dbbf5016f521a74ede9ec20ad696133))
- **farmers:** ♻️rename fetch method for clarity ([856a70e](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/856a70e549c96efec24cfecaed6966c5670369e9))
- **farmers:** ♻️simplify farmers data fetching and processing logic ([5b55ab6](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/5b55ab60d09543d8c6d29f0cf02ecc4ca50647d4))
- **farmers:** ♻️simplify farmers data fetching and processing logic ([946e943](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/946e9438eef914c166bb362a0c7f238ae5f99261))
- **farmers:** ♻️simplify fetch and process logic ([0d36fc6](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/0d36fc6d425ef230efbf65c682b029a7655c0e91))
- **gap, merchants, news, substance:** ♻️rename fetch methods for clarity ([23ea447](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/23ea447791b3256457b8ed7aa3e60ed786366dea))
- **gap:** ♻️enhance logging for GAP page info ([762ec1f](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/762ec1fa9c24dfa53c79412fd51a6fb17d485dec))
- **gap:** ♻️improve gap fetching logic to support multiple years ([c37d781](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/c37d7813aa6a9c15801335b0f301d677d11f13ef))
- **gap:** ♻️simplify fetch and process logic ([1aa8bc6](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/1aa8bc6d41dd15b5a5b06dab68f613719505fc58))
- **gap:** ♻️simplify gap fetching logic and improve error handling ([048d9fc](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/048d9fc229be4d4bea23c7c97f0e9dfd2100934f))
- **gapLogger:** ♻️standardize logging for page info with year context ([94dd150](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/94dd1509d33cab315032651b49055e0b72a698bf))
- **merchants:** ♻️simplify fetch logic in MerchantsProcessor ([50b20d3](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/50b20d3daad419411f074cb2eccd32e2ecb2f70b))
- **merchants:** ♻️simplify merchants data fetching logic ([2bcee86](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/2bcee86f2fa09628f9e816fa5729cdb3d6684792))
- **merchants:** ♻️simplify merchants fetching logic and improve error handling ([02fce06](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/02fce063f7a37e882b7813620d825289a8a5b906))
- **news:** ♻️simplify fetch logic in NewsProcessor ([e1de6ba](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/e1de6baa8b6458954a9a2cc4f653ff9bc8b10b4e))
- **news:** ♻️simplify news data fetching logic ([e27da95](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/e27da958c25905425c46be2e907a8c3ffd8b7c7b))
- **news:** ♻️simplify news fetching logic and improve error handling ([3c65fa2](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/3c65fa253cee9c537876b1262c0603f7b1445412))
- **newsProcessor, operationsProcessor:** ♻️standardize request body structure for API calls ([67818ea](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/67818ea00c518423129ed5ec20fe71cd70aaafae))
- **operations:** ♻️simplify fetch logic in OperationsProcessor ([d9b86bb](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/d9b86bb37380e27d78dda2b42ac7978d7790e637))
- **operations:** ♻️simplify operations fetching logic and improve error handling ([9711764](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/971176423e3ebd723a9d6a49c7b22ac74fd6a9ce))
- **operations:** ♻️standardize logging for page info with year context ([5782586](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/578258687a370ca76a4c0e828a88066a9953d947))
- **operationsProcessor:** ♻️standardize date range for operations data fetching ([06d4e4c](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/06d4e4cd29ee8ea83efc980363c89b24c55a60a6))
- **substance:** ♻️rename fetch method for clarity ([a9847bb](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/a9847bb8dc288b9732892b110d1da18bd62bd4c9))
- **substance:** ♻️simplify fetch logic in SubstanceProcessor ([160804b](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/160804bd2171f1e3bc3e891c4cae864718da66ad))
- **substance:** ♻️simplify fetch logic in SubstanceProcessor ([732e012](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/732e0124595db40d2a2330facdf59f91eed9f04a))
- **substance:** ♻️simplify substance fetching logic and improve error handling ([5a6e6e5](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/5a6e6e54c38fd148af1d62fb13ffd2c1fa539b2d))
- **substanceLogger:** ♻️standardize logging for page info with year context ([d05502a](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/d05502a6b3d16a7b359c8fcc7d305915f4114cec))
- **water:** ♻️simplify water data fetching logic ([64c7654](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/64c76542247ad50153e21c88a9fffe89adc19d7c))
- **water:** ♻️simplify water fetching logic and improve error handling ([bc546f4](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/bc546f477b68e44c40b8169749e68e5c071b2068))
- **waterLogger:** ♻️standardize logging for page info with year context ([9e3ff53](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/9e3ff534fee14a76d00f2b48a50959b8ca6d1c10))

### 🧹 Chore

- **.gitignore:** 🙈add result-from-database to ignore list ([cfca738](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/cfca73811f53adb379206c711a2148c1bd9a3631))
- **.gitignore:** 🙈add venv to .gitignore ([647d3df](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/647d3df8687947f3f7fda726add9be0d073c516f))
- **.gitignore:** 🙈update .gitignore to include automation scripts ([cf2ca75](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/cf2ca759a9357d68b9114897a6de91bea64988ff))
- update package.json with new scripts and dependencies ([6b5b935](https://github.com/<YOUR_GH_USERNAME>/<YOUR_REPO>/commit/6b5b9358c9c2ecda89fd54b040791e047796612c))

## [2.0.0](https://github.com/usertopio/otod-durian-lab1/compare/v1.0.1...v2.0.0) (2025-08-09)

### Features

- **api:** ✅enable crops endpoint for fetching crops data ([47d14b1](https://github.com/usertopio/otod-durian-lab1/commit/47d14b1f208d50e874ff6824571c0dc7ba919db1))
- **api:** ✨add DurianGardensLogger for enhanced logging of garden data processing ([0debdd2](https://github.com/usertopio/otod-durian-lab1/commit/0debdd2aed29df2753c220cd424f42d689b1e15a))
- **api:** ✨add DurianGardensProcessor for fetching and processing garden data ([0fcdaed](https://github.com/usertopio/otod-durian-lab1/commit/0fcdaed8a533efdf048470415e986fa577f08b65))
- **api:** ✨add DurianGardensService with fetching and resetting functionality ([4fcc842](https://github.com/usertopio/otod-durian-lab1/commit/4fcc842113514cb7cdd38c3a0c32d878ae17d0c2))
- **api:** ✨add fetchDurianGardensUntilTarget controller ([849df5e](https://github.com/usertopio/otod-durian-lab1/commit/849df5e252cc09b2e07ccc4fc533a94cf38d03b3))
- **api:** ✨add fetchDurianGardensUntilTarget endpoint ([024d898](https://github.com/usertopio/otod-durian-lab1/commit/024d898ecbe807b78b15617543876173f1ee8a80))
- **api:** ✨add fetchGapUntilTarget endpoint ([84204a0](https://github.com/usertopio/otod-durian-lab1/commit/84204a08023ed332f103bd57ec798731e6ebf399))
- **api:** ✨add fetchGapUntilTarget endpoint for gap retrieval ([81ffea5](https://github.com/usertopio/otod-durian-lab1/commit/81ffea5ece51507f9955d2f7e32ba7ffc5aa83bd))
- **api:** ✨refactor communities endpoint to use fetchCommunitiesUntilTarget ([68d3df3](https://github.com/usertopio/otod-durian-lab1/commit/68d3df33ea667658153a60d7245e34a925380da4))
- **api:** ✨refactor communities fetching logic to use CommunitiesService ([2344c8e](https://github.com/usertopio/otod-durian-lab1/commit/2344c8eeb48cd3ca0120faece619a816865ff2e9))
- **api:** ✨refactor fetchWater endpoint to improve clarity and usage ([94acada](https://github.com/usertopio/otod-durian-lab1/commit/94acada0383c441af9f2b6607f7a7fda3e51003c))
- **api:** ✨update fetchOperations endpoint to fetchOperationsUntilTarget ([43bfd96](https://github.com/usertopio/otod-durian-lab1/commit/43bfd96ef4f36c1320fd3a0e2231e25c310857cd))
- **config:** 🌿add Crops and Durian Gardens configuration updates ([4480831](https://github.com/usertopio/otod-durian-lab1/commit/4480831dbe59ef6c9fe6418eb05517cf8dc5aa95))
- **config:** 🌿add Durian Gardens configuration following farmers template ([34dc520](https://github.com/usertopio/otod-durian-lab1/commit/34dc520fb1c777dc7fe909857fe6dc8035a7dfd2))
- **constants:** ✨add communities configuration constants ([0f0e514](https://github.com/usertopio/otod-durian-lab1/commit/0f0e51462edc11ee4acc685910073d5af53ad13b))
- **constants:** ✨add Crops configuration with updated default values ([3025b27](https://github.com/usertopio/otod-durian-lab1/commit/3025b2759e51e3b9f66c61856d68b64fac49184b))
- **constants:** ✨add DEFAULT_TOTAL_RECORDS and DEFAULT_PAGE_SIZE to MERCHANTS_CONFIG ([ae825c6](https://github.com/usertopio/otod-durian-lab1/commit/ae825c6c3b182d1d2fc29499b1ca6bb89cf14c9d))
- **constants:** ✨add GAP configuration constants ([5665110](https://github.com/usertopio/otod-durian-lab1/commit/5665110674e8921e79fbc919f3ba3a8ff5bb4ae1))
- **constants:** ✨add MERCHANTS_CONFIG for merchant settings ([57512e7](https://github.com/usertopio/otod-durian-lab1/commit/57512e7d103ac1c38317d1e07c6a5e9e5fbe9942))
- **constants:** ✨add OPERATIONS_CONFIG for operations handling ([da5ef80](https://github.com/usertopio/otod-durian-lab1/commit/da5ef80e67dec0bfb87fd31207e8386825e2de8f))
- **constants:** ✨add STATUS constant and update FARMERS_CONFIG ([9d2d654](https://github.com/usertopio/otod-durian-lab1/commit/9d2d65463c91ffff17513d92099bb3b3f20d354b))
- **constants:** ✨add WATER_CONFIG for water data management ([62574aa](https://github.com/usertopio/otod-durian-lab1/commit/62574aa3f439ecb08b7c3e05594454fa5bc383ac))
- **db:** ✨add insertOrUpdateCommunity function for community management ([bc6a296](https://github.com/usertopio/otod-durian-lab1/commit/bc6a296c22f63fc8d2261eb18ebe65cf02202d18))
- **db:** ✨add insertOrUpdateDurianGarden function for managing garden data ([f201980](https://github.com/usertopio/otod-durian-lab1/commit/f2019804680a6c687e635b277b6b4ff7cae1ff12))
- **db:** ✨add insertOrUpdateGap function for GAP certificate management ([bc419e9](https://github.com/usertopio/otod-durian-lab1/commit/bc419e9ddf80df286f082c015b5275792c01b582))
- **db:** ✨add insertOrUpdateOperation for advanced operation handling ([6d37563](https://github.com/usertopio/otod-durian-lab1/commit/6d3756347cfd003d6ebff3482d998c18591d5ba1))
- **db:** ✨add insertOrUpdateWater functionality for water records ([821ac11](https://github.com/usertopio/otod-durian-lab1/commit/821ac1190bc2a56c59928726a3f714f1dfe43ab7))
- **db:** ✨implement insertOrUpdateMerchant functionality with location code generation ([33f4db6](https://github.com/usertopio/otod-durian-lab1/commit/33f4db69bd32c63ad23e679b5a86533302e6dea5))
- **db:** 🔧refactor ensureRefCode function for improved reference code handling ([23c3b1c](https://github.com/usertopio/otod-durian-lab1/commit/23c3b1c365d4dc7bef793f86c1941a19fb3e7f32))
- **gap:** ✨add GapLogger for logging gap processing metrics ([0460f83](https://github.com/usertopio/otod-durian-lab1/commit/0460f8342665b9a0670331efd13ccecbc8a60ab7))
- **gap:** ✨add GapProcessor for fetching and processing GAP certificates ([017f8ee](https://github.com/usertopio/otod-durian-lab1/commit/017f8ee395d03fdfb60829da48dfc443a6e17ed4))
- **gap:** ✨add GapService for gap processing until target count ([e60bc43](https://github.com/usertopio/otod-durian-lab1/commit/e60bc439e5d1c11fb577d1d5239eeda121ddb6e2))
- **merchants:** ✨add fetchMerchantsUntilTarget functionality ([77a57a1](https://github.com/usertopio/otod-durian-lab1/commit/77a57a1758c4ed02288b0764134f052eeeeca245))
- **merchants:** ✨add MerchantsLogger class for enhanced logging ([d6bfb73](https://github.com/usertopio/otod-durian-lab1/commit/d6bfb73fecc1c4204aabebfecd17231c14a41be6))
- **merchants:** ✨add MerchantsProcessor class for fetching and processing merchant data ([fe9c633](https://github.com/usertopio/otod-durian-lab1/commit/fe9c633876608d77f464105a90ad2db6018cd85f))
- **merchants:** ✨add MerchantsService class for fetching merchants until target count ([0ade938](https://github.com/usertopio/otod-durian-lab1/commit/0ade938af7a602c81ee3c032993eab0a31231ee9))
- **news:** ✨implement fetchNewsUntilTarget functionality with logging ([f2a4f9e](https://github.com/usertopio/otod-durian-lab1/commit/f2a4f9e5113bec7e4319931d7b2ef6485efc9b55))
- **operations:** ✨add fetchOperationsUntilTarget method for targeted data retrieval ([6c68cd4](https://github.com/usertopio/otod-durian-lab1/commit/6c68cd40c4f3afb8ea1e939cec240651fed0a44f))
- **operations:** ✨add OperationsLogger for detailed logging of operations processing ([bca5e7a](https://github.com/usertopio/otod-durian-lab1/commit/bca5e7a1010f4c24e61c1a09024cc4b0617d9433))
- **operations:** ✨add OperationsProcessor for fetching and processing operations data ([5cfab99](https://github.com/usertopio/otod-durian-lab1/commit/5cfab9906314671b39b0c3f7d624f7efb49e9948))
- **operations:** ✨add OperationsService for targeted operations fetching ([62c0b9c](https://github.com/usertopio/otod-durian-lab1/commit/62c0b9cf3298d7335c972356a7f4fa25112e4f70))
- **services:** ✨add CommunitiesLogger for detailed logging of community operations ([d2ce6bd](https://github.com/usertopio/otod-durian-lab1/commit/d2ce6bdab1dd30cee2f4a3e01c238a374a22dff5))
- **services:** ✨add CommunitiesProcessor for community data handling ([2855f06](https://github.com/usertopio/otod-durian-lab1/commit/2855f069214250c6688be4586c3a8a865f47add7))
- **services:** ✨add CommunitiesService for community data fetching and processing ([348a0f5](https://github.com/usertopio/otod-durian-lab1/commit/348a0f5da295cec88d1ec0455bf0483de0d3d0a2))
- **services:** ✨add CropsService for managing crop data ([f291aa1](https://github.com/usertopio/otod-durian-lab1/commit/f291aa15bb9fe0b3b613c49bce2b94868a9eaf68))
- **substance:** ✨add substance processing and logging functionality ([220a500](https://github.com/usertopio/otod-durian-lab1/commit/220a5002e249d44ed6b163796e3567ab09a8cdfe))
- **water:** ✨add WaterLogger class for logging water data processing ([971f14d](https://github.com/usertopio/otod-durian-lab1/commit/971f14d95dd3ebea0613899ba4488bd7ea059d6e))
- **water:** ✨add WaterProcessor class for fetching and processing water data ([2fe7a14](https://github.com/usertopio/otod-durian-lab1/commit/2fe7a14e86fc5c031296ea15c0dc83d1e4b7a809))
- **water:** ✨add WaterService class for managing water data fetching ([a6803f2](https://github.com/usertopio/otod-durian-lab1/commit/a6803f2fc51c393844bd963aaac88b229672baaa))
- **water:** ✨refactor WaterController to implement fetchWater method ([f981cfb](https://github.com/usertopio/otod-durian-lab1/commit/f981cfb65d3ccd32d4346149ea1752de5290f515))

### Bug Fixes

- **config:** 🔧correct database configuration path in gapProcessor.js ([c7400f7](https://github.com/usertopio/otod-durian-lab1/commit/c7400f7175abe365389ba286add0f246af2c4d6c))
- **config:** 🔧update max attempts for various configurations ([94caa88](https://github.com/usertopio/otod-durian-lab1/commit/94caa88a761ea375038ed350a47168b7d256c03a))
- **db:** 🔧correct database configuration path for community operations ([5fa80d8](https://github.com/usertopio/otod-durian-lab1/commit/5fa80d8e80d08e609faa58497b2cde2ca02f6dbb))
- **db:** 🔧correct database configuration path in gapDb.js ([70ad29c](https://github.com/usertopio/otod-durian-lab1/commit/70ad29c93d6e922b856e5e4688d491eac51e11e9))
- **db:** 🔧use nullish coalescing for garden area fields ([363ed58](https://github.com/usertopio/otod-durian-lab1/commit/363ed5823b2326f991f51cf8d3c82f41e61a7c94))

### [1.0.1](https://github.com/usertopio/otod-durian-lab1/compare/v1.0.0...v1.0.1) (2025-07-31)

## 1.0.0 (2025-07-31)

### Features

- **api:** ✨add both operations and operation summary fetching and insertion functionality ([64e186e](https://github.com/usertopio/otod-durian-lab1/commit/64e186e2965519fc79b83303ac42d3d2f68a0b9c))
- **api:** ✨add communities fetching and insertion functionality ([8d731ee](https://github.com/usertopio/otod-durian-lab1/commit/8d731eec3e843f56564ccd42eed85a989026c2f6))
- **api:** ✨add community summary fetching and insertion functionality ([6b749b9](https://github.com/usertopio/otod-durian-lab1/commit/6b749b98a4396003282d73ab07935a12089be04b))
- **api:** ✨add crop forecast and yield fetching and insertion functionality ([8c390fb](https://github.com/usertopio/otod-durian-lab1/commit/8c390fbba3b2386f5b28b73481e20821319ecbc0))
- **api:** ✨add crop harvest fetching and insertion functionality ([c5f91ff](https://github.com/usertopio/otod-durian-lab1/commit/c5f91ff98b0e2fc4016d33dd14ac9cff8232fe5e))
- **api:** ✨add crop stage summary fetching and insertion functionality ([e5bf3fc](https://github.com/usertopio/otod-durian-lab1/commit/e5bf3fcec126cfe76853099c7ddd6dc658356ceb))
- **api:** ✨add crop summary fetching and insertion functionality ([4a8c932](https://github.com/usertopio/otod-durian-lab1/commit/4a8c932f7213c61b250434c96fddc2a9f489404d))
- **api:** ✨add crops route for fetching data ([61b9085](https://github.com/usertopio/otod-durian-lab1/commit/61b9085cd89c01c3c0b5b9e96d74ff1901ef3162))
- **api:** ✨add express.json() middleware for JSON parsing ([85383be](https://github.com/usertopio/otod-durian-lab1/commit/85383be3229a011026e532997c71553c2341125e))
- **api:** ✨add farmers fetching endpoint and service integration ([d43f2cb](https://github.com/usertopio/otod-durian-lab1/commit/d43f2cbc4ceaf420ee4bcb805af613cd3cf96100))
- **api:** ✨add farmers fetching functionality ([ca49a1b](https://github.com/usertopio/otod-durian-lab1/commit/ca49a1bf88ddc3d27e3cd316a25ed5bec8c49a26))
- **api:** ✨add fetchAndStoreLandGeoJSON controller for processing land data ([2420749](https://github.com/usertopio/otod-durian-lab1/commit/2420749c56989d634f76e73fa4389a9f11819c9c))
- **api:** ✨add fetchCrops controller and getCrops service ([edb8cba](https://github.com/usertopio/otod-durian-lab1/commit/edb8cba8afe7a7304ac83312da49dcb78c0b2b27))
- **api:** ✨add fetchFarmerSummary endpoint and service ([1df2383](https://github.com/usertopio/otod-durian-lab1/commit/1df2383820c05b8efa40cdf2887c2245c54ae1f2))
- **api:** ✨add GAP summary fetching and insertion functionality ([561471f](https://github.com/usertopio/otod-durian-lab1/commit/561471f80cb6d5bceddf1fd5f9c671337978ad27))
- **api:** ✨add getLandGeoJSON function for land data retrieval ([a31b884](https://github.com/usertopio/otod-durian-lab1/commit/a31b884e2c29ffbaaec67414f4da225c4a68869e))
- **api:** ✨add land summary fetching and database insertion logic ([3dddce4](https://github.com/usertopio/otod-durian-lab1/commit/3dddce405052aae0c81a170aaeb8bcfba72e5b21))
- **api:** ✨add merchant summary fetching and insertion functionality ([37c0454](https://github.com/usertopio/otod-durian-lab1/commit/37c04548bceda81072aa9d8271eb052ad033816f))
- **api:** ✨add merchants fetching and insertion functionality ([a964466](https://github.com/usertopio/otod-durian-lab1/commit/a964466aecd110b13dafbd1d64cff3ec02925d13))
- **api:** ✨add news fetching and summary functionality ([de6cafe](https://github.com/usertopio/otod-durian-lab1/commit/de6cafef5764c635beb837c78e381488e39e4c91))
- **api:** ✨add runLandGeoJSON function for processing land data ([115415e](https://github.com/usertopio/otod-durian-lab1/commit/115415e0b314ffd59933aa9b987b6671ed0bfeb5))
- **api:** ✨add substance usage summary fetching and insertion functionality ([292be8e](https://github.com/usertopio/otod-durian-lab1/commit/292be8e9dadc84750016df6049278458179f6075))
- **api:** ✨add transformLandGeoJSON function for processing land data ([ab8af6e](https://github.com/usertopio/otod-durian-lab1/commit/ab8af6e116e6c99fb131c062988c051e6183854a))
- **api:** ✨add water usage summary fetching and insertion functionality ([3105d12](https://github.com/usertopio/otod-durian-lab1/commit/3105d121a882bd9f81eea26161df10ebd2d8d074))
- **api:** ✨enhance fetchLandGeoJSON controller with detailed logging and data transformation ([d6742cb](https://github.com/usertopio/otod-durian-lab1/commit/d6742cbf8c8e3775d5372a7ffad8c6e868f3de2f))
- **api:** ✨implement pagination for fetching farmers data ([433042e](https://github.com/usertopio/otod-durian-lab1/commit/433042e3bb3ebda14b806200c3297cc495d8bce5))
- **api:** ✨update fetchLandGeoJSON controller and improve module imports ([f91ae96](https://github.com/usertopio/otod-durian-lab1/commit/f91ae9699f26c1edd13f5ad59be37f4fcbc74289))
- **api:** ✨update water usage service paths for consistency ([9cf943c](https://github.com/usertopio/otod-durian-lab1/commit/9cf943cb261cd4daf0a117800f0f28969b0f3d2e))
- **api:** 🎉initialize server with express, morgan, and cors ([5c920bd](https://github.com/usertopio/otod-durian-lab1/commit/5c920bd7938d88de2c4e8e4eefaa37dc126bf029))
- **config:** ✨add landGeoJSON configuration for database connection ([22fec64](https://github.com/usertopio/otod-durian-lab1/commit/22fec645d30c58752c67fb27fb5f87aad9f8142f))
- **config:** 🔧add configuration for API connection ([1a42d04](https://github.com/usertopio/otod-durian-lab1/commit/1a42d04c64058c4f3fee803091119a3259e8f6a2))
- **config:** 🔧add headers configuration for API requests ([7d604c1](https://github.com/usertopio/otod-durian-lab1/commit/7d604c1f9583c30000c09116461256fea8e9739e))
- **crops:** ✨add crop fetching and insertion functionality ([c9d56fd](https://github.com/usertopio/otod-durian-lab1/commit/c9d56fd798e2bd5f7c410f302ef5cfb25039aa56))
- **crops:** 🎉add initial crops configuration and service files ([11dfe15](https://github.com/usertopio/otod-durian-lab1/commit/11dfe1572a81e8475e8372831eccd414efb393a8))
- **db:** ✨add farmer summary fields and insertion logic ([d3f4f5c](https://github.com/usertopio/otod-durian-lab1/commit/d3f4f5c0236f9d43f786a3dd64c044f079585c3b))
- **db:** ✨add insertLandGeoJSON function for inserting land GeoJSON data ([5611da6](https://github.com/usertopio/otod-durian-lab1/commit/5611da6dd10384df4eecd244a096099b482cbb0e))
- **db:** ✨add land data fetching and database insertion logic ([e2a92a9](https://github.com/usertopio/otod-durian-lab1/commit/e2a92a95a7df9c58b50dd136a70faf607bdf9441))
- **db:** ✨move farmers and lands configuration files to config/db ([4192260](https://github.com/usertopio/otod-durian-lab1/commit/4192260be985b6125df861487a862f3996b3cd37))
- **db:** ✨refactor water usage configuration and insertion functions ([143bca0](https://github.com/usertopio/otod-durian-lab1/commit/143bca0920df08da77c5e7ed6c0e8faad9021d62))
- **db:** 🗃️add database connection and farmer fields configuration ([d12465e](https://github.com/usertopio/otod-durian-lab1/commit/d12465e6bd740ad2a85656164d5b668224b1e5d7))
- **db:** 🗃️add MySQL connection setup ([11a362a](https://github.com/usertopio/otod-durian-lab1/commit/11a362aaffd7a02dc7a810e671249b06e8e49dc0))

### Bug Fixes

- **api:** 🐛correct area field names in landGeoJSON transformation ([fdb7ed0](https://github.com/usertopio/otod-durian-lab1/commit/fdb7ed03e0165ce0e034b91badc14a2960e7bcbc))
- **api:** 🐛correct community, crop, land, operation, substance, and water usage summary response structures ([c1d34b1](https://github.com/usertopio/otod-durian-lab1/commit/c1d34b16c21e725fb9dd4b43da0b1aa796ab0100))
- **api:** 🐛correct crop summary response structure ([a28e9af](https://github.com/usertopio/otod-durian-lab1/commit/a28e9af79b831689ee3ee3d0ce4189205a67138f))
- **api:** 🐛fix incorrect function name for fetching farmer summary ([3b34e10](https://github.com/usertopio/otod-durian-lab1/commit/3b34e10e95d6a1dd0ac7af95b6bf94937ac2c872))
- **config:** 🔧add cropForecastAndYieldFields to configuration ([1fda776](https://github.com/usertopio/otod-durian-lab1/commit/1fda7763f226ebe2d43844a09622933110ea00d9))
- **db:** ♻️fix inserting data with wrong type by converting plain object to array object ([adb6df6](https://github.com/usertopio/otod-durian-lab1/commit/adb6df6d2cea51e4cd0509c257436b1512dc4a60))
- **routes:** 🔧correct controller import path for lands ([70bfea8](https://github.com/usertopio/otod-durian-lab1/commit/70bfea8fd248a8014e9bc97788601486d4bb8da1))
