# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.10.0](https://github.com/Tada5hi/routup/compare/routup@0.9.1...routup@0.10.0) (2023-01-08)


### Features

* **prometheus:** initialized new prometheus plugin ([d41c7ad](https://github.com/Tada5hi/routup/commit/d41c7ad82de422e6e6d07da3308cf53ca8078ea8))





## [0.9.1](https://github.com/Tada5hi/routup/compare/routup@0.9.0...routup@0.9.1) (2023-01-05)

**Note:** Version bump only for package routup





# [0.9.0](https://github.com/Tada5hi/routup/compare/routup@0.8.3...routup@0.9.0) (2022-12-21)


### Features

* add static-middleware plugin ([ae633a1](https://github.com/Tada5hi/routup/commit/ae633a18530a236257780c0a4bffc926f93381a1))





## [0.8.3](https://github.com/Tada5hi/routup/compare/routup@0.8.2...routup@0.8.3) (2022-12-20)

**Note:** Version bump only for package routup





## [0.8.2](https://github.com/Tada5hi/routup/compare/routup@0.8.1...routup@0.8.2) (2022-12-20)


### Bug Fixes

* **deps:** bump zod from 3.19.1 to 3.20.0 ([0a92156](https://github.com/Tada5hi/routup/commit/0a9215612fd3c66a2a2659e8b8dd326cf654cfad))
* **deps:** bump zod from 3.20.0 to 3.20.2 ([263a600](https://github.com/Tada5hi/routup/commit/263a600f634d95d78a2f3276ab34cfced9f634db))
* move is-object util ([1060f66](https://github.com/Tada5hi/routup/commit/1060f668316f1edecc629d1eb255a245486381c5))
* **routup:** remove unnecessary import statement ([50b7069](https://github.com/Tada5hi/routup/commit/50b706933d17113a9158183c4b86d6ba6301149f))





## [0.8.1](https://github.com/Tada5hi/routup/compare/routup@0.8.0...routup@0.8.1) (2022-12-09)


### Bug Fixes

* **routup:** handle thrown route middleware error correctly ([43354cb](https://github.com/Tada5hi/routup/commit/43354cba99ff1c24f91f3d734e9c1b6170996532))





# [0.8.0](https://github.com/Tada5hi/routup/compare/routup@0.7.0...routup@0.8.0) (2022-12-04)


### Features

* **routup:** enhanced config container + add validations ([8d9cb7f](https://github.com/Tada5hi/routup/commit/8d9cb7fe9769d04bd779eb42d6b1bc5facbeeb0d))
* **routup:** use set-immediate to increase concurrent connections ([c240659](https://github.com/Tada5hi/routup/commit/c24065952c8c9bf4c804e5c87924166064a9f9ed))





# [0.7.0](https://github.com/Tada5hi/routup/compare/routup@0.6.0...routup@0.7.0) (2022-11-26)


### Bug Fixes

* **routup:** use case-sensitive option for path matcher ([e8af7e4](https://github.com/Tada5hi/routup/commit/e8af7e4c16e44240862c185d12aee1e06c1a68b9))
* **routup:** use static error option constants ([109da37](https://github.com/Tada5hi/routup/commit/109da379286b81dc7e8ca1e63c7103119fa8a027))


### Features

* **routup:** add request hostname helper fn ([556a79a](https://github.com/Tada5hi/routup/commit/556a79a8b6c318565a2e9ffd1b3906faa15b3edb))
* **routup:** add request ip helper fn ([70cdf12](https://github.com/Tada5hi/routup/commit/70cdf120fb6db7efb688f716dedb41e5553bbcd8))
* **routup:** add request protocol helper fn ([4516174](https://github.com/Tada5hi/routup/commit/451617480ec3991412b76b1e0bb481627c231f61))
* **routup:** global config container to manage options ([208be22](https://github.com/Tada5hi/routup/commit/208be2279d1cb6b6877417e133a2b20bc8314793))





# [0.6.0](https://github.com/Tada5hi/routup/compare/routup@0.5.0...routup@0.6.0) (2022-11-21)


### Features

* new decorator(s) package/plugin ([511524c](https://github.com/Tada5hi/routup/commit/511524c854f5cdb7222b4cdea2a252a57c2007d1))





# [0.5.0](https://github.com/Tada5hi/routup/compare/routup@0.4.1...routup@0.5.0) (2022-11-18)


### Features

* **routup:** add support for head & options requests ([9dd0010](https://github.com/Tada5hi/routup/commit/9dd001049f2b2861aa1c6764dcaca560db243d50))





## [0.4.1](https://github.com/Tada5hi/routup/compare/routup@0.4.0...routup@0.4.1) (2022-11-17)


### Bug Fixes

* add append-response-header helper ([dc0b501](https://github.com/Tada5hi/routup/commit/dc0b5016271d2e93f26ae644847b15795bc2cd00))





# [0.4.0](https://github.com/Tada5hi/routup/compare/routup@0.3.2...routup@0.4.0) (2022-11-17)


### Bug Fixes

* **routup:** only timeout request if options is set ([e806d92](https://github.com/Tada5hi/routup/commit/e806d92f32c253490b6aeaa6f67bce321f663557))
* **routup:** process handler execution output ([f6d14cb](https://github.com/Tada5hi/routup/commit/f6d14cb5e9a7f267a93e382d0b130c66ffca0db2))


### Features

* **swagger:** initialise project + ui submodule ([48c4944](https://github.com/Tada5hi/routup/commit/48c4944241a42a49f0ff2e530b5f875e09470ed9))





## [0.3.2](https://github.com/Tada5hi/routup/compare/routup@0.3.1...routup@0.3.2) (2022-11-15)


### Bug Fixes

* **routup:** enhance patch matching for route methods ([188e07a](https://github.com/Tada5hi/routup/commit/188e07ab00eb65ee69a97391e436cee017925f25))





## [0.3.1](https://github.com/Tada5hi/routup/compare/routup@0.3.0...routup@0.3.1) (2022-11-14)


### Bug Fixes

* **routup:** add missing res helper exports ([b78e4af](https://github.com/Tada5hi/routup/commit/b78e4af3ef228f893b44c8e68d2cfd2d6722ff4f))





# [0.3.0](https://github.com/Tada5hi/routup/compare/routup@0.3.0-alpha.0...routup@0.3.0) (2022-11-14)


### Bug Fixes

* rename decorator meta fn parameter ([be47a68](https://github.com/Tada5hi/routup/commit/be47a6867dc7eaa3196ad83b39d1b7c987a00def))





# [0.3.0-alpha.0](https://github.com/Tada5hi/routup/compare/routup@0.2.0...routup@0.3.0-alpha.0) (2022-11-14)


### Bug Fixes

* **routup:** add missing handler export ([596b76c](https://github.com/Tada5hi/routup/commit/596b76c1c318acf9a5dc1b52410b3eaffe27776b))


### Features

* **body:** add expermintal decorator support ([accf1fd](https://github.com/Tada5hi/routup/commit/accf1fd518fd301705175545070c7a2a185b2b99))
* **routup:** add experimental decroator support ([6c00303](https://github.com/Tada5hi/routup/commit/6c00303c25dd06248057d9b98bee7b3e855c1c94))





# [0.2.0](https://github.com/Tada5hi/routup/compare/routup@0.1.4...routup@0.2.0) (2022-11-09)


### Features

* **body:** add body use & set helper ([a7017b7](https://github.com/Tada5hi/routup/commit/a7017b7118f5fe215641b0e7d6c841b5fa2b7b4f))





## [0.1.4](https://github.com/Tada5hi/routup/compare/routup@0.1.3...routup@0.1.4) (2022-11-09)


### Bug Fixes

* **routup:** add tiny acepted & created response send helpers ([afa4297](https://github.com/Tada5hi/routup/commit/afa429757602a42991f7061c28ceabb4260dc1d6))





## [0.1.3](https://github.com/Tada5hi/routup/compare/routup@0.1.2...routup@0.1.3) (2022-11-08)


### Bug Fixes

* **routup:** set 400 (instead 500) status-code if handler throws error ([9d8d509](https://github.com/Tada5hi/routup/commit/9d8d509f3cfc0333525efb57d8721a2f0883d3e9))





## [0.1.2](https://github.com/Tada5hi/routup/compare/routup@0.1.1...routup@0.1.2) (2022-11-07)


### Bug Fixes

* **routup:** add missing export + minor README.md fix ([29e3905](https://github.com/Tada5hi/routup/commit/29e39052ced2de1783af2ffa16ef95f26b4c5fb0))





## [0.1.1](https://github.com/Tada5hi/routup/compare/routup@0.1.0...routup@0.1.1) (2022-11-07)

**Note:** Version bump only for package routup





# 0.1.0 (2022-11-07)


### Bug Fixes

* allow regexp or string for routing path ([f86ccca](https://github.com/Tada5hi/routup/commit/f86ccca6918a4924e0682137b505eb6c36b2bce6))


### Features

* **routup:** better naming & splitting for request header helpers ([2883c68](https://github.com/Tada5hi/routup/commit/2883c681e9828897ec4426fcad2e47827a0b90d5))
