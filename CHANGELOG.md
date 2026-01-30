## [4.0.2](https://github.com/routup/routup/compare/v4.0.1...v4.0.2) (2025-06-25)


### Bug Fixes

* **deps:** bump negotiator from 0.6.3 to 1.0.0 ([#700](https://github.com/routup/routup/issues/700)) ([84edd77](https://github.com/routup/routup/commit/84edd778b87d8baa9072319909385324f265e8a7))
* **deps:** bump the minorandpatch group with 3 updates ([#758](https://github.com/routup/routup/issues/758)) ([c0117b3](https://github.com/routup/routup/commit/c0117b34c81f3be26f5c60a5ce71e7e81b6ed4ed))

## [4.1.0](https://github.com/routup/routup/compare/v4.0.2...v4.1.0) (2026-01-30)


### ⚠ BREAKING CHANGES

* remove support for regex as path input
* removed request helper fns
* handler must be defined with helper fn
* interface names changed
* dispatch is now async
* listen method removed
* send, etag fn api changed
* Public API changed

### Features

* add define (error-) handler helpers for intellisense ([2318115](https://github.com/routup/routup/commit/2318115c18955dea7e890344555dc43208200555))
* add send-format helper + test suite ([2a7b0d5](https://github.com/routup/routup/commit/2a7b0d59e16bb3f867617bc54360a349b7526013))
* add swagger generator for api endpoints ([c8ff8a7](https://github.com/routup/routup/commit/c8ff8a78c4e0e8b6399db567ce8b882bac2c1e83))
* allways create new router instance on plugin installation ([e77022f](https://github.com/routup/routup/commit/e77022f55992f79fd6aa639d424443db0bbcedee))
* argument overloading for http method handler registration ([72393c4](https://github.com/routup/routup/commit/72393c4b5cac92e0cda7900b3803101e92b91a62))
* better error handling for no matching route and unhandled error ([252b178](https://github.com/routup/routup/commit/252b17839c0da8f7f15a202ae2ac693ceec0f63f))
* bump path-to-regexp to v7.x ([9a82dc8](https://github.com/routup/routup/commit/9a82dc8975d3227e47f91c676769f616f65dd7be))
* cache request path + extended header constants ([78e039c](https://github.com/routup/routup/commit/78e039c685e12ce64ada04324ac177b649ef3cde))
* changed send-file options api ([8a6c328](https://github.com/routup/routup/commit/8a6c32816b9f6e1a6a6a1ee62f3af5b1d82394bf))
* context (error-) handler style ([72af754](https://github.com/routup/routup/commit/72af754000eb1987229d721626bad1bcf20d0e56))
* contextualize hook listeners ([7c3a7ce](https://github.com/routup/routup/commit/7c3a7ceae05372d8023bccb6495569466bc976d6))
* dispatch pipeline ([#420](https://github.com/routup/routup/issues/420)) ([321b811](https://github.com/routup/routup/commit/321b81169476781c97c1ea64082bb5d34e3d57cb))
* dispatcher event attribute to call next router/handler ([0a1efa7](https://github.com/routup/routup/commit/0a1efa71113217c5ffe6bbd9e97f4449379051a5))
* do not expose utils ([acd451c](https://github.com/routup/routup/commit/acd451c18c5220abbd8491ca0efffa389ed389a3))
* dynamic getter/setter for event dispatched property ([34f0750](https://github.com/routup/routup/commit/34f0750fcd4a8baebf4b7d9adc323be0e1119b7b))
* gone utility helper ([dc4f83b](https://github.com/routup/routup/commit/dc4f83bed20a8a18003e5d4714b47d2a97e56ec5))
* helpers to send web-{blob,response} ([2014da4](https://github.com/routup/routup/commit/2014da43281f251f988c077e74d70d5fa1016669))
* hook system ([#411](https://github.com/routup/routup/issues/411)) ([137b2fa](https://github.com/routup/routup/commit/137b2faea9c20637015726c8044500255d424333))
* implemented plugin system ([808dd72](https://github.com/routup/routup/commit/808dd727fb6102dc22ae18f62daab4d5633d0111))
* implicit and explicit handler definition variant ([02caec8](https://github.com/routup/routup/commit/02caec8992f204667a512db5e5cc5b6fdaa57b52))
* include stream, web- & web-response detection in send helper ([f59977e](https://github.com/routup/routup/commit/f59977e6849e6e913f308099966d03e9bd351d5c))
* initial server-sent events implementation ([67c45c3](https://github.com/routup/routup/commit/67c45c39b8b99d2c3e90c3922f21670e7ee25d96))
* make dispatch call stack async ([21b3388](https://github.com/routup/routup/commit/21b338838baa6040e3014e7b6810c5bb8fc403d1))
* merge core & routup package ([45c32fb](https://github.com/routup/routup/commit/45c32fb839cd345b6c79fe3b33a424ffd4eee830))
* merge dispatcher-event & dispatcher-meta ([ad0afab](https://github.com/routup/routup/commit/ad0afabc729e186c3c7f062c6431c8bb1e41448d))
* method name enum to uppercase & add method property to dispatcher event ([709666e](https://github.com/routup/routup/commit/709666eaea6a0b7f4c5731a969905683c857583f))
* minor internal api changes ([83b46e5](https://github.com/routup/routup/commit/83b46e5f2d09bf58ced2e9e8dc9a8637106746b7))
* polyfill for node path basename & extname ([f3c4af7](https://github.com/routup/routup/commit/f3c4af73a38f0f95004c9291a82d5aa84c5914c0))
* prefix node module imports + replaced smob is-object with local implementation ([70a1a21](https://github.com/routup/routup/commit/70a1a219737fa26224e5494cf74d548712362ea4))
* **rate-limit-redis:** initial release ([5442233](https://github.com/routup/routup/commit/5442233bfe9ff40419a0b281b934549bb6cc945d))
* recognize handlers by type property in addition to the number of fn arguments ([86dcc18](https://github.com/routup/routup/commit/86dcc18a153c2200dbe012debab6cab45a6e570b))
* refactor configuration handling ([63a4101](https://github.com/routup/routup/commit/63a41012b4b89d6d09e119280e4e73bcf33ad085))
* refactor dispatching requests; stack cb- to iteration-style ([7e97e8a](https://github.com/routup/routup/commit/7e97e8a0a16065336bc162efec075aa0878846c8))
* remove body-, cookie- & query-helper ([bcc0347](https://github.com/routup/routup/commit/bcc0347045bf2997c1c1fff02f5cba09cda25fed))
* remove dependence to createServer fn from node:http ([f0b45de](https://github.com/routup/routup/commit/f0b45de9f0bb1091f041260b8a6d95d8a776d761))
* remove env property from options ([7cff979](https://github.com/routup/routup/commit/7cff9799aefaf0fe9ea320e2ee95d6b6b0830b00))
* remove explicit URL import from node:url ([feb3d46](https://github.com/routup/routup/commit/feb3d46667537b894bb5f10f6447f8f3b763d323))
* remove implicit handler recognition ([8d623f1](https://github.com/routup/routup/commit/8d623f1acc855c1a6288abaa20314b6eb68f04f8))
* remove route interface between router and layer ([b149002](https://github.com/routup/routup/commit/b1490027a8d59bb5a7ab7faa6180024d4ecaef9f))
* renamed dispatcher event properties: req -&gt; request, res -> response ([36a2401](https://github.com/routup/routup/commit/36a2401bc9dfee2d3d10d9d3a1821fd173282627))
* replaced rollup,esbuild & ts-jest with swc ([eec4671](https://github.com/routup/routup/commit/eec46710781894532b9be0b0b9d1b911f0c7e937))
* return handler instance on define handler usage ([84dfdd1](https://github.com/routup/routup/commit/84dfdd133ac09e0513778eda3edbfbcfceb29920))
* revert interface renaming + enhanced project structure ([bbab2bc](https://github.com/routup/routup/commit/bbab2bcb9d3e2cf2a29143d19c2650fdd38895bc))
* rewrite to be runtime agnostic ([7680f6a](https://github.com/routup/routup/commit/7680f6a9ed0e6af8ccdda202522a0bc86ed05fff))
* serve swagger ui template on paths with no trail slash ([da780dd](https://github.com/routup/routup/commit/da780dd4b424a2a11311fa04dfe1d3e4cdb8abc8))
* sse emit close & error event ([cb4fdfe](https://github.com/routup/routup/commit/cb4fdfee673d99c8f097e7fcf7383c392de224ef))
* **swagger:** remove resolve-package-path dependency ([d3df1b7](https://github.com/routup/routup/commit/d3df1b77b3d7edd367bdaf7c1efedff02fb782ab))
* use async webcrypto api for etag generation ([eb805d5](https://github.com/routup/routup/commit/eb805d5e5f53cb6cb098c19a9b31c5fcbde79404))
* use rollup + swc for transpiling and bundle code for esm/cjs ([aeabf06](https://github.com/routup/routup/commit/aeabf06d2372f315bdbe33546ea5dacb74ce6d9d))
* utility to set/get property of req/res ([c070a80](https://github.com/routup/routup/commit/c070a808a770abb11d1ddd0b9558032e19307219))
* wrap any error like object & extract error information ([#377](https://github.com/routup/routup/issues/377)) ([59f2a72](https://github.com/routup/routup/commit/59f2a72e7c4e9ffbd7031fdab613d08da2ede1a4))


### Bug Fixes

* add additional type exports of trapi/swagger ([21e2973](https://github.com/routup/routup/commit/21e2973a27ab8cbb203f65b0f202d5a4e280a2bf))
* add missing export for mixed decorators ([a944a56](https://github.com/routup/routup/commit/a944a564dc4894f213ad6a510bbd514935bbcfd4))
* building decorator method arguments ([e1d7139](https://github.com/routup/routup/commit/e1d7139e0fd5d89ed7535d067681e118bc3e7a68))
* bump smob version to v1.4.x ([d42c7e9](https://github.com/routup/routup/commit/d42c7e97f3f1feeb3988b655bc3ad06531d9ad21))
* call handler execution + send-file api ([91bd7dc](https://github.com/routup/routup/commit/91bd7dc68a96bdab6410b268dfd8133dbb84c426))
* change dependency from core to routup package ([b3f203a](https://github.com/routup/routup/commit/b3f203ac1a07190db6913620e620d8b930681e74))
* check dispatched status after hook execution ([1be1d9e](https://github.com/routup/routup/commit/1be1d9eb3ee13197231c6ee9aad0dc6b6c910bf8))
* cleanup cookie and query handler + extended test suites ([1e46be9](https://github.com/routup/routup/commit/1e46be9ff907a1741e80e7135b5f00a984b410a2))
* cleanup router, route & layer ([78aa73d](https://github.com/routup/routup/commit/78aa73d0e2661ab43abe7d52adc01dfd6f7c220f))
* **core:** updated mime dependency ([591252b](https://github.com/routup/routup/commit/591252b369491d1cbfbef6b39fabdf8a271e170b))
* decorator parameter generation (return argument) ([71eb522](https://github.com/routup/routup/commit/71eb52285a642ff69d4bfa7afb703d11c0071418))
* default export for output build ([7f9afbf](https://github.com/routup/routup/commit/7f9afbf6bf1266aeb90cffc2527d20b8a154b580))
* **deps:** buffer library for agnostic runtime ([e9b3843](https://github.com/routup/routup/commit/e9b3843a929d6b294f3ad9917ba008d15a15d6f0))
* **deps:** bump @ebec/http from 0.1.0 to 0.2.2 ([#115](https://github.com/routup/routup/issues/115)) ([d4bf39d](https://github.com/routup/routup/commit/d4bf39db27f0d50a8c79c7856d993554ea94722f))
* **deps:** bump @ebec/http from 0.2.2 to 1.0.0 ([#197](https://github.com/routup/routup/issues/197)) ([5ec751c](https://github.com/routup/routup/commit/5ec751c9a2db6b02cc6396d6794d38c5b5e51445))
* **deps:** bump @ebec/http from 1.0.0 to 1.1.0 ([#272](https://github.com/routup/routup/issues/272)) ([2157d4b](https://github.com/routup/routup/commit/2157d4baab579aa0801387458d4ad9bec148755a))
* **deps:** bump @ebec/http from 2.2.1 to 2.2.2 ([#402](https://github.com/routup/routup/issues/402)) ([737be95](https://github.com/routup/routup/commit/737be95464ed9380ad6e95531cd3ba70a5b73bc2))
* **deps:** bump @ebec/http to v2.3.0 & check for inherited properties ([e8495f0](https://github.com/routup/routup/commit/e8495f0b9494117dcb1fc3700eb129802b16ea05))
* **deps:** bump @trapi/swagger from 1.0.0-alpha.10 to 1.0.0-alpha.12 ([#194](https://github.com/routup/routup/issues/194)) ([7797c00](https://github.com/routup/routup/commit/7797c00ed396ce7932bbff652e6b4f434d35c90d))
* **deps:** bump body-parser from 1.20.1 to 1.20.2 ([#158](https://github.com/routup/routup/issues/158)) ([c23a434](https://github.com/routup/routup/commit/c23a434e75b6cf23ac94b80f05a41569f759ba65))
* **deps:** bump continu from 1.0.5 to 1.3.1 ([#215](https://github.com/routup/routup/issues/215)) ([20e77df](https://github.com/routup/routup/commit/20e77df7ce2c9bdb4645195aa29724ec667f4628))
* **deps:** bump continu from 1.3.1 to 1.3.2 ([#302](https://github.com/routup/routup/issues/302)) ([85eec1f](https://github.com/routup/routup/commit/85eec1f350f616768ae484b6f28c6ba7315a7af1))
* **deps:** bump cookie-es from 0.5.0 to 1.0.0 ([#239](https://github.com/routup/routup/issues/239)) ([c5e7923](https://github.com/routup/routup/commit/c5e7923dab5d9d31f1a7d278d3708e8a5d2d5bcb))
* **deps:** bump cookiejar from 2.1.3 to 2.1.4 ([#98](https://github.com/routup/routup/issues/98)) ([24d9b19](https://github.com/routup/routup/commit/24d9b198211c824d6237178e2deeeaa1e0040e0b))
* **deps:** bump http-cache-semantics from 4.1.0 to 4.1.1 ([#122](https://github.com/routup/routup/issues/122)) ([2faeb37](https://github.com/routup/routup/commit/2faeb3799b220e559a23d8254d1914e67d544dad))
* **deps:** bump mime-explorer from 1.0.0 to 1.1.0 ([#461](https://github.com/routup/routup/issues/461)) ([d9c3ab9](https://github.com/routup/routup/commit/d9c3ab9f957fee45dfbf554b8a53e615d7986fcb))
* **deps:** bump negotiator from 0.6.3 to 1.0.0 ([#700](https://github.com/routup/routup/issues/700)) ([84edd77](https://github.com/routup/routup/commit/84edd778b87d8baa9072319909385324f265e8a7))
* **deps:** bump path-to-regexp from 7.0.0 to 7.1.0 ([#625](https://github.com/routup/routup/issues/625)) ([23fcd28](https://github.com/routup/routup/commit/23fcd2840ea3ebfada8f1222195405718169810a))
* **deps:** bump path-to-regexp to v8.x ([87048a1](https://github.com/routup/routup/commit/87048a16fa149a060f8382286b646a1f0fb49c29))
* **deps:** bump peer-dependencies ([f353d3e](https://github.com/routup/routup/commit/f353d3e6e0c7f1752b66ba4c70302786e1216165))
* **deps:** bump qs from 6.11.0 to 6.11.1 ([#177](https://github.com/routup/routup/issues/177)) ([778a74b](https://github.com/routup/routup/commit/778a74bf46b01e2d981e8a7c3cae3c45c6e4427d))
* **deps:** bump readable-stream from 4.4.2 to 4.5.2 ([#482](https://github.com/routup/routup/issues/482)) ([5dab8f3](https://github.com/routup/routup/commit/5dab8f391bf3fe0d8b894344790455deae1db3fe))
* **deps:** bump smob from 0.0.7 to 0.1.0 ([#120](https://github.com/routup/routup/issues/120)) ([5a83923](https://github.com/routup/routup/commit/5a839236ac72232cf1bf0ba693f8d193830876e4))
* **deps:** bump smob from 0.1.0 to 1.0.0 ([#198](https://github.com/routup/routup/issues/198)) ([9a5ca76](https://github.com/routup/routup/commit/9a5ca760e917ebd94a6e5025b0fc9edb635346c5))
* **deps:** bump smob from 1.4.0 to 1.4.1 ([#382](https://github.com/routup/routup/issues/382)) ([c3a19eb](https://github.com/routup/routup/commit/c3a19ebebe52626a4dc6b5c9df1d4983a0876eed))
* **deps:** bump smob from 1.4.1 to 1.5.0 ([#538](https://github.com/routup/routup/issues/538)) ([53bb4ae](https://github.com/routup/routup/commit/53bb4aedb470c28c0f3c9d126334d9fbbbaf7011))
* **deps:** bump swagger-ui-dist from 4.15.5 to 4.18.1 ([#176](https://github.com/routup/routup/issues/176)) ([d4c5423](https://github.com/routup/routup/commit/d4c54230fbe469387fde8b0a5685bb31523975c0))
* **deps:** bump swagger-ui-dist from 4.18.1 to 4.18.2 ([#222](https://github.com/routup/routup/issues/222)) ([ef6fd34](https://github.com/routup/routup/commit/ef6fd34aef5ff077565a25942b09bcf284b323ad))
* **deps:** bump swagger-ui-dist from 4.18.2 to 4.18.3 ([#249](https://github.com/routup/routup/issues/249)) ([82e4d06](https://github.com/routup/routup/commit/82e4d0630d468bc20a52a778e94b636d70d4c71e))
* **deps:** bump the minorandpatch group across 1 directory with 14 updates ([#795](https://github.com/routup/routup/issues/795)) ([252a852](https://github.com/routup/routup/commit/252a852212715b0563461ccf8e0ade446f3361c1))
* **deps:** bump the minorandpatch group with 3 updates ([#758](https://github.com/routup/routup/issues/758)) ([c0117b3](https://github.com/routup/routup/commit/c0117b34c81f3be26f5c60a5ce71e7e81b6ed4ed))
* **deps:** bump vitepress from 1.0.0-alpha.36 to 1.0.0-alpha.38 ([945cc76](https://github.com/routup/routup/commit/945cc7666f1d67e45761723be1b08208abac9fb6))
* **deps:** bump vitepress from 1.0.0-alpha.38 to 1.0.0-alpha.40 ([#96](https://github.com/routup/routup/issues/96)) ([aeeef16](https://github.com/routup/routup/commit/aeeef16dea3dfbaea3822355a1db625e8635ffa1))
* **deps:** bump vitepress from 1.0.0-alpha.40 to 1.0.0-alpha.44 ([#116](https://github.com/routup/routup/issues/116)) ([fc2f07c](https://github.com/routup/routup/commit/fc2f07ced8958f554eb781640b99a4cdc392c44e))
* **deps:** bump vitepress from 1.0.0-alpha.44 to 1.0.0-alpha.45 ([#119](https://github.com/routup/routup/issues/119)) ([305a9b1](https://github.com/routup/routup/commit/305a9b1beb01acad833bc5dce2a22f9a222bd2e1))
* **deps:** bump vitepress from 1.0.0-alpha.45 to 1.0.0-alpha.46 ([#139](https://github.com/routup/routup/issues/139)) ([26eb833](https://github.com/routup/routup/commit/26eb833709eef699643751912edd759da29f13ef))
* **deps:** bump vitepress from 1.0.0-alpha.46 to 1.0.0-alpha.51 ([#171](https://github.com/routup/routup/issues/171)) ([8b70827](https://github.com/routup/routup/commit/8b708275bd046e7f53888a9e0eb4f5b9b1c8e801))
* **deps:** bump vitepress from 1.0.0-alpha.51 to 1.0.0-alpha.54 ([#180](https://github.com/routup/routup/issues/180)) ([a5ef4a8](https://github.com/routup/routup/commit/a5ef4a8634bebddbd1de5e43732c8c8ff7fa4c2a))
* **deps:** bump vitepress from 1.0.0-alpha.54 to 1.0.0-alpha.60 ([#187](https://github.com/routup/routup/issues/187)) ([0cb2c8a](https://github.com/routup/routup/commit/0cb2c8a2e94bc4aebe599080ed7ea99a0137cde2))
* **deps:** bump vitepress from 1.0.0-alpha.60 to 1.0.0-alpha.64 ([#209](https://github.com/routup/routup/issues/209)) ([d17f55a](https://github.com/routup/routup/commit/d17f55a7462a83d51cf29e65965d5d6817f619fa))
* **deps:** bump vitepress from 1.0.0-alpha.64 to 1.0.0-alpha.72 ([#218](https://github.com/routup/routup/issues/218)) ([0338672](https://github.com/routup/routup/commit/0338672083c81e461a430eb8e9b35c7b9932ca96))
* **deps:** bump vitepress from 1.0.0-alpha.72 to 1.0.0-alpha.75 ([#250](https://github.com/routup/routup/issues/250)) ([01a699d](https://github.com/routup/routup/commit/01a699dd064b9ec1e50d9208331d4f7a3f5ef940))
* **deps:** bump vue from 3.2.45 to 3.2.47 ([#126](https://github.com/routup/routup/issues/126)) ([dd7631b](https://github.com/routup/routup/commit/dd7631bce104dc1926e45ddd4ac4c00288e912aa))
* **deps:** bump vue from 3.2.47 to 3.3.1 ([#241](https://github.com/routup/routup/issues/241)) ([7ab5c32](https://github.com/routup/routup/commit/7ab5c32b67192d63a050be3b74f3b02fdbe11aba))
* **deps:** bump zod from 3.20.2 to 3.20.3 ([#133](https://github.com/routup/routup/issues/133)) ([386fec6](https://github.com/routup/routup/commit/386fec6ec9f1415f832e71bc971178af5694adae))
* **deps:** bump zod from 3.20.3 to 3.20.6 ([#135](https://github.com/routup/routup/issues/135)) ([c575c2f](https://github.com/routup/routup/commit/c575c2f1a210b310f81f7c3a57289b8158925418))
* **deps:** bump zod from 3.20.6 to 3.21.4 ([#174](https://github.com/routup/routup/issues/174)) ([356df0f](https://github.com/routup/routup/commit/356df0ff13e2378fc5961e371c63fb90b76aff4b))
* **deps:** remove zod library ([5fd2f04](https://github.com/routup/routup/commit/5fd2f049e4d1acb4ce99b25148ddd63b80aa510e))
* **deps:** updated linting & tsconfig preset ([269685d](https://github.com/routup/routup/commit/269685d395bcb46ec71430b284c7a8a9ca363063))
* dispatching raw/web request ([039ac84](https://github.com/routup/routup/commit/039ac842a21fc85726ec11ad874ebd53032e75eb))
* don't pass plugin options as extra fn argument ([d05e4c9](https://github.com/routup/routup/commit/d05e4c985eb9a0567f73d7500a2abf892b5d2cd9))
* exceeding of byte range for file streaming + added tests ([bec5b1b](https://github.com/routup/routup/commit/bec5b1bdf5186410937a324120a36bf245f73f87))
* export is-file-url ([fabe1fd](https://github.com/routup/routup/commit/fabe1fd008bcab1a8391acef5cd3b24ebc7b15ba))
* mark response as terminated after event stream is closed ([3efdef1](https://github.com/routup/routup/commit/3efdef129c7da542965319d26f8dc8fdc649f0b5))
* minor bug fixes & dispatcher restructuring ([453b5a9](https://github.com/routup/routup/commit/453b5a98256515d116652857a2ac3ce7abc42dc7))
* minor enhancements + added benchmark to README.md ([e7f5276](https://github.com/routup/routup/commit/e7f527688d4883ae2bb7fd73003bacb259b06066))
* peer-dependency definition for trapi/swagger ([b2c374c](https://github.com/routup/routup/commit/b2c374c5785bd39ec11b8e0da79755f5390880c1))
* prefix node modules imports with node: ([a45055a](https://github.com/routup/routup/commit/a45055a15d09e4e299c6772ff2d385f9f62468ad))
* remove cookie/query fn setter ([eb9c6c1](https://github.com/routup/routup/commit/eb9c6c1d60d8373a17614bde7499043f98a1bae0))
* remove dispatch fail hook ([05342d0](https://github.com/routup/routup/commit/05342d0dc255114900d133cf51ad5f4bb60c9f09))
* remove match hook type ([64eaeb6](https://github.com/routup/routup/commit/64eaeb6c5453ee684b0402aedb72e9f1c01003fc))
* remove undocumented timeout router option ([c4b2bae](https://github.com/routup/routup/commit/c4b2baeb7fa25ac2fc5940079d09023d3cdc26b8))
* rename error-proxy to routup-error ([4a6e1b2](https://github.com/routup/routup/commit/4a6e1b29c9ce77c3a818a67612b389beb038d9e6))
* rename handler hooks to child ([888a57d](https://github.com/routup/routup/commit/888a57ddcb7049006308a5d8d8a8df96a5350424))
* rename method constant to method-name ([5e42609](https://github.com/routup/routup/commit/5e4260939e9c28456b2336eccd6af117ff66fb9d))
* renamed getRequestIp to getRequestIP ([8bf44c9](https://github.com/routup/routup/commit/8bf44c9de5bbbeaab03bbafd761f3ccd242487fe))
* return promise.reject instead of throwing error ([a31c68e](https://github.com/routup/routup/commit/a31c68e3cbd1c3332b3b3196621170967e5189cb))
* separate set/extend body payload + added fn overloading for cookie & query ([c27dde4](https://github.com/routup/routup/commit/c27dde43b47f00b4426ff155e9ea57b04c420982))
* set remote address for mock request ([5649d9e](https://github.com/routup/routup/commit/5649d9ec98e8426fc1315fad7d94dcc44862f278))
* set target version to es2022 ([eb7e5cb](https://github.com/routup/routup/commit/eb7e5cbf17994f3601cd0d8937e6dde59c912a09))
* stricter conditions for call handler fn ([102e2b2](https://github.com/routup/routup/commit/102e2b2f299abc1b780b60e86edce01d786b4ffe))
* **swagger:** assets path resolution ([84b62b8](https://github.com/routup/routup/commit/84b62b8e643b243eaf216c2ce4731f605ce22cf4))
* use named imports of proxy-addr lib ([be57140](https://github.com/routup/routup/commit/be57140f3df2706e4a611c4097a95bfd6f3a5b61))
* use sub-package for eslint configuration ([26e8546](https://github.com/routup/routup/commit/26e8546e81729ed75a1e6bc142b92252c23f0b2d))


### Performance Improvements

* use typeof instead of instanceof for instance check ([c98a070](https://github.com/routup/routup/commit/c98a07025b2941f0afbbac6f369fa9977d564ad9))


### Miscellaneous Chores

* set next version ([50935a4](https://github.com/routup/routup/commit/50935a4e255cc5041c37203fbf4be40dd367d67e))


### Code Refactoring

* prefixed node specific interfaces ([b6444e9](https://github.com/routup/routup/commit/b6444e9cef97e7cb39aa0ddfeac26cb2009842e4))

## [4.0.1](https://github.com/routup/routup/compare/v4.0.0...v4.0.1) (2024-09-15)


### Bug Fixes

* **deps:** bump path-to-regexp from 7.0.0 to 7.1.0 ([#625](https://github.com/routup/routup/issues/625)) ([23fcd28](https://github.com/routup/routup/commit/23fcd2840ea3ebfada8f1222195405718169810a))
* **deps:** bump path-to-regexp to v8.x ([87048a1](https://github.com/routup/routup/commit/87048a16fa149a060f8382286b646a1f0fb49c29))

# [4.0.0](https://github.com/routup/routup/compare/v3.3.0...v4.0.0) (2024-06-29)


### Features

* bump path-to-regexp to v7.x ([9a82dc8](https://github.com/routup/routup/commit/9a82dc8975d3227e47f91c676769f616f65dd7be))
* utility to set/get property of req/res ([c070a80](https://github.com/routup/routup/commit/c070a808a770abb11d1ddd0b9558032e19307219))


### BREAKING CHANGES

* remove support for regex as path input

# [3.3.0](https://github.com/routup/routup/compare/v3.2.0...v3.3.0) (2024-03-30)


### Bug Fixes

* **deps:** bump mime-explorer from 1.0.0 to 1.1.0 ([#461](https://github.com/routup/routup/issues/461)) ([d9c3ab9](https://github.com/routup/routup/commit/d9c3ab9f957fee45dfbf554b8a53e615d7986fcb))
* **deps:** bump readable-stream from 4.4.2 to 4.5.2 ([#482](https://github.com/routup/routup/issues/482)) ([5dab8f3](https://github.com/routup/routup/commit/5dab8f391bf3fe0d8b894344790455deae1db3fe))
* **deps:** bump smob from 1.4.1 to 1.5.0 ([#538](https://github.com/routup/routup/issues/538)) ([53bb4ae](https://github.com/routup/routup/commit/53bb4aedb470c28c0f3c9d126334d9fbbbaf7011))
* mark response as terminated after event stream is closed ([3efdef1](https://github.com/routup/routup/commit/3efdef129c7da542965319d26f8dc8fdc649f0b5))


### Features

* initial server-sent events implementation ([67c45c3](https://github.com/routup/routup/commit/67c45c39b8b99d2c3e90c3922f21670e7ee25d96))
* sse emit close & error event ([cb4fdfe](https://github.com/routup/routup/commit/cb4fdfee673d99c8f097e7fcf7383c392de224ef))

# [3.2.0](https://github.com/routup/routup/compare/v3.1.0...v3.2.0) (2023-11-06)


### Features

* include stream, web- & web-response detection in send helper ([f59977e](https://github.com/routup/routup/commit/f59977e6849e6e913f308099966d03e9bd351d5c))

# [3.1.0](https://github.com/routup/routup/compare/v3.0.0...v3.1.0) (2023-10-22)


### Bug Fixes

* check dispatched status after hook execution ([1be1d9e](https://github.com/routup/routup/commit/1be1d9eb3ee13197231c6ee9aad0dc6b6c910bf8))
* **deps:** bump @ebec/http to v2.3.0 & check for inherited properties ([e8495f0](https://github.com/routup/routup/commit/e8495f0b9494117dcb1fc3700eb129802b16ea05))
* remove dispatch fail hook ([05342d0](https://github.com/routup/routup/commit/05342d0dc255114900d133cf51ad5f4bb60c9f09))
* remove match hook type ([64eaeb6](https://github.com/routup/routup/commit/64eaeb6c5453ee684b0402aedb72e9f1c01003fc))
* rename error-proxy to routup-error ([4a6e1b2](https://github.com/routup/routup/commit/4a6e1b29c9ce77c3a818a67612b389beb038d9e6))
* rename handler hooks to child ([888a57d](https://github.com/routup/routup/commit/888a57ddcb7049006308a5d8d8a8df96a5350424))


### Features

* contextualize hook listeners ([7c3a7ce](https://github.com/routup/routup/commit/7c3a7ceae05372d8023bccb6495569466bc976d6))
* dispatch pipeline ([#420](https://github.com/routup/routup/issues/420)) ([321b811](https://github.com/routup/routup/commit/321b81169476781c97c1ea64082bb5d34e3d57cb))
* dispatcher event attribute to call next router/handler ([0a1efa7](https://github.com/routup/routup/commit/0a1efa71113217c5ffe6bbd9e97f4449379051a5))
* dynamic getter/setter for event dispatched property ([34f0750](https://github.com/routup/routup/commit/34f0750fcd4a8baebf4b7d9adc323be0e1119b7b))
* hook system ([#411](https://github.com/routup/routup/issues/411)) ([137b2fa](https://github.com/routup/routup/commit/137b2faea9c20637015726c8044500255d424333))
* merge dispatcher-event & dispatcher-meta ([ad0afab](https://github.com/routup/routup/commit/ad0afabc729e186c3c7f062c6431c8bb1e41448d))
* method name enum to uppercase & add method property to dispatcher event ([709666e](https://github.com/routup/routup/commit/709666eaea6a0b7f4c5731a969905683c857583f))
* renamed dispatcher event properties: req -> request, res -> response ([36a2401](https://github.com/routup/routup/commit/36a2401bc9dfee2d3d10d9d3a1821fd173282627))
* return handler instance on define handler usage ([84dfdd1](https://github.com/routup/routup/commit/84dfdd133ac09e0513778eda3edbfbcfceb29920))

# [3.0.0](https://github.com/routup/routup/compare/v2.0.0...v3.0.0) (2023-10-04)


### Bug Fixes

* cleanup router, route & layer ([78aa73d](https://github.com/routup/routup/commit/78aa73d0e2661ab43abe7d52adc01dfd6f7c220f))
* **deps:** bump @ebec/http from 2.2.1 to 2.2.2 ([#402](https://github.com/routup/routup/issues/402)) ([737be95](https://github.com/routup/routup/commit/737be95464ed9380ad6e95531cd3ba70a5b73bc2))
* **deps:** bump smob from 1.4.0 to 1.4.1 ([#382](https://github.com/routup/routup/issues/382)) ([c3a19eb](https://github.com/routup/routup/commit/c3a19ebebe52626a4dc6b5c9df1d4983a0876eed))
* don't pass plugin options as extra fn argument ([d05e4c9](https://github.com/routup/routup/commit/d05e4c985eb9a0567f73d7500a2abf892b5d2cd9))
* remove undocumented timeout router option ([c4b2bae](https://github.com/routup/routup/commit/c4b2baeb7fa25ac2fc5940079d09023d3cdc26b8))
* set remote address for mock request ([5649d9e](https://github.com/routup/routup/commit/5649d9ec98e8426fc1315fad7d94dcc44862f278))


### Features

* add define (error-) handler helpers for intellisense ([2318115](https://github.com/routup/routup/commit/2318115c18955dea7e890344555dc43208200555))
* allways create new router instance on plugin installation ([e77022f](https://github.com/routup/routup/commit/e77022f55992f79fd6aa639d424443db0bbcedee))
* argument overloading for http method handler registration ([72393c4](https://github.com/routup/routup/commit/72393c4b5cac92e0cda7900b3803101e92b91a62))
* context (error-) handler style ([72af754](https://github.com/routup/routup/commit/72af754000eb1987229d721626bad1bcf20d0e56))
* implemented plugin system ([808dd72](https://github.com/routup/routup/commit/808dd727fb6102dc22ae18f62daab4d5633d0111))
* implicit and explicit handler definition variant ([02caec8](https://github.com/routup/routup/commit/02caec8992f204667a512db5e5cc5b6fdaa57b52))
* recognize handlers by type property in addition to the number of fn arguments ([86dcc18](https://github.com/routup/routup/commit/86dcc18a153c2200dbe012debab6cab45a6e570b))
* remove body-, cookie- & query-helper ([bcc0347](https://github.com/routup/routup/commit/bcc0347045bf2997c1c1fff02f5cba09cda25fed))
* remove implicit handler recognition ([8d623f1](https://github.com/routup/routup/commit/8d623f1acc855c1a6288abaa20314b6eb68f04f8))
* remove route interface between router and layer ([b149002](https://github.com/routup/routup/commit/b1490027a8d59bb5a7ab7faa6180024d4ecaef9f))
* wrap any error like object & extract error information ([#377](https://github.com/routup/routup/issues/377)) ([59f2a72](https://github.com/routup/routup/commit/59f2a72e7c4e9ffbd7031fdab613d08da2ede1a4))


### Performance Improvements

* use typeof instead of instanceof for instance check ([c98a070](https://github.com/routup/routup/commit/c98a07025b2941f0afbbac6f369fa9977d564ad9))


### BREAKING CHANGES

* removed request helper fns
* handler must be defined with helper fn

# [3.0.0-alpha.3](https://github.com/routup/routup/compare/v3.0.0-alpha.2...v3.0.0-alpha.3) (2023-09-29)


### Features

* remove body-, cookie- & query-helper ([bcc0347](https://github.com/routup/routup/commit/bcc0347045bf2997c1c1fff02f5cba09cda25fed))


### BREAKING CHANGES

* removed request helper fns

# [3.0.0-alpha.2](https://github.com/routup/routup/compare/v3.0.0-alpha.1...v3.0.0-alpha.2) (2023-09-29)


### Bug Fixes

* don't pass plugin options as extra fn argument ([d05e4c9](https://github.com/routup/routup/commit/d05e4c985eb9a0567f73d7500a2abf892b5d2cd9))

# [3.0.0-alpha.1](https://github.com/routup/routup/compare/v2.0.0...v3.0.0-alpha.1) (2023-09-29)


### Bug Fixes

* cleanup router, route & layer ([78aa73d](https://github.com/routup/routup/commit/78aa73d0e2661ab43abe7d52adc01dfd6f7c220f))
* **deps:** bump smob from 1.4.0 to 1.4.1 ([#382](https://github.com/routup/routup/issues/382)) ([c3a19eb](https://github.com/routup/routup/commit/c3a19ebebe52626a4dc6b5c9df1d4983a0876eed))
* remove undocumented timeout router option ([c4b2bae](https://github.com/routup/routup/commit/c4b2baeb7fa25ac2fc5940079d09023d3cdc26b8))
* set remote address for mock request ([5649d9e](https://github.com/routup/routup/commit/5649d9ec98e8426fc1315fad7d94dcc44862f278))


### Features

* add define (error-) handler helpers for intellisense ([2318115](https://github.com/routup/routup/commit/2318115c18955dea7e890344555dc43208200555))
* context (error-) handler style ([72af754](https://github.com/routup/routup/commit/72af754000eb1987229d721626bad1bcf20d0e56))
* implemented plugin system ([808dd72](https://github.com/routup/routup/commit/808dd727fb6102dc22ae18f62daab4d5633d0111))
* implicit and explicit handler definition variant ([02caec8](https://github.com/routup/routup/commit/02caec8992f204667a512db5e5cc5b6fdaa57b52))
* recognize handlers by type property in addition to the number of fn arguments ([86dcc18](https://github.com/routup/routup/commit/86dcc18a153c2200dbe012debab6cab45a6e570b))
* remove implicit handler recognition ([8d623f1](https://github.com/routup/routup/commit/8d623f1acc855c1a6288abaa20314b6eb68f04f8))
* remove route interface between router and layer ([b149002](https://github.com/routup/routup/commit/b1490027a8d59bb5a7ab7faa6180024d4ecaef9f))
* wrap any error like object & extract error information ([#377](https://github.com/routup/routup/issues/377)) ([59f2a72](https://github.com/routup/routup/commit/59f2a72e7c4e9ffbd7031fdab613d08da2ede1a4))


### Performance Improvements

* use typeof instead of instanceof for instance check ([c98a070](https://github.com/routup/routup/commit/c98a07025b2941f0afbbac6f369fa9977d564ad9))


### BREAKING CHANGES

* handler must be defined with helper fn

# [2.0.0](https://github.com/routup/routup/compare/v1.0.3...v2.0.0) (2023-09-14)


### Bug Fixes

* call handler execution + send-file api ([91bd7dc](https://github.com/routup/routup/commit/91bd7dc68a96bdab6410b268dfd8133dbb84c426))
* **deps:** buffer library for agnostic runtime ([e9b3843](https://github.com/routup/routup/commit/e9b3843a929d6b294f3ad9917ba008d15a15d6f0))
* **deps:** remove zod library ([5fd2f04](https://github.com/routup/routup/commit/5fd2f049e4d1acb4ce99b25148ddd63b80aa510e))
* dispatching raw/web request ([039ac84](https://github.com/routup/routup/commit/039ac842a21fc85726ec11ad874ebd53032e75eb))
* minor bug fixes & dispatcher restructuring ([453b5a9](https://github.com/routup/routup/commit/453b5a98256515d116652857a2ac3ce7abc42dc7))
* minor enhancements + added benchmark to README.md ([e7f5276](https://github.com/routup/routup/commit/e7f527688d4883ae2bb7fd73003bacb259b06066))
* return promise.reject instead of throwing error ([a31c68e](https://github.com/routup/routup/commit/a31c68e3cbd1c3332b3b3196621170967e5189cb))
* stricter conditions for call handler fn ([102e2b2](https://github.com/routup/routup/commit/102e2b2f299abc1b780b60e86edce01d786b4ffe))


### Code Refactoring

* prefixed node specific interfaces ([b6444e9](https://github.com/routup/routup/commit/b6444e9cef97e7cb39aa0ddfeac26cb2009842e4))


### Features

* better error handling for no matching route and unhandled error ([252b178](https://github.com/routup/routup/commit/252b17839c0da8f7f15a202ae2ac693ceec0f63f))
* changed send-file options api ([8a6c328](https://github.com/routup/routup/commit/8a6c32816b9f6e1a6a6a1ee62f3af5b1d82394bf))
* do not expose utils ([acd451c](https://github.com/routup/routup/commit/acd451c18c5220abbd8491ca0efffa389ed389a3))
* gone utility helper ([dc4f83b](https://github.com/routup/routup/commit/dc4f83bed20a8a18003e5d4714b47d2a97e56ec5))
* helpers to send web-{blob,response} ([2014da4](https://github.com/routup/routup/commit/2014da43281f251f988c077e74d70d5fa1016669))
* make dispatch call stack async ([21b3388](https://github.com/routup/routup/commit/21b338838baa6040e3014e7b6810c5bb8fc403d1))
* polyfill for node path basename & extname ([f3c4af7](https://github.com/routup/routup/commit/f3c4af73a38f0f95004c9291a82d5aa84c5914c0))
* refactor configuration handling ([63a4101](https://github.com/routup/routup/commit/63a41012b4b89d6d09e119280e4e73bcf33ad085))
* refactor dispatching requests; stack cb- to iteration-style ([7e97e8a](https://github.com/routup/routup/commit/7e97e8a0a16065336bc162efec075aa0878846c8))
* remove dependence to createServer fn from node:http ([f0b45de](https://github.com/routup/routup/commit/f0b45de9f0bb1091f041260b8a6d95d8a776d761))
* remove env property from options ([7cff979](https://github.com/routup/routup/commit/7cff9799aefaf0fe9ea320e2ee95d6b6b0830b00))
* remove explicit URL import from node:url ([feb3d46](https://github.com/routup/routup/commit/feb3d46667537b894bb5f10f6447f8f3b763d323))
* revert interface renaming + enhanced project structure ([bbab2bc](https://github.com/routup/routup/commit/bbab2bcb9d3e2cf2a29143d19c2650fdd38895bc))
* rewrite to be runtime agnostic ([7680f6a](https://github.com/routup/routup/commit/7680f6a9ed0e6af8ccdda202522a0bc86ed05fff))
* use async webcrypto api for etag generation ([eb805d5](https://github.com/routup/routup/commit/eb805d5e5f53cb6cb098c19a9b31c5fcbde79404))


### BREAKING CHANGES

* interface names changed
* dispatch is now async
* listen method removed
* send, etag fn api changed

## [1.0.3](https://github.com/routup/routup/compare/v1.0.2...v1.0.3) (2023-09-03)


### Bug Fixes

* use named imports of proxy-addr lib ([be57140](https://github.com/routup/routup/commit/be57140f3df2706e4a611c4097a95bfd6f3a5b61))

## [1.0.2](https://github.com/routup/routup/compare/v1.0.1...v1.0.2) (2023-07-18)


### Bug Fixes

* **deps:** bump @ebec/http from 1.0.0 to 1.1.0 ([#272](https://github.com/routup/routup/issues/272)) ([2157d4b](https://github.com/routup/routup/commit/2157d4baab579aa0801387458d4ad9bec148755a))
* **deps:** bump continu from 1.3.1 to 1.3.2 ([#302](https://github.com/routup/routup/issues/302)) ([85eec1f](https://github.com/routup/routup/commit/85eec1f350f616768ae484b6f28c6ba7315a7af1))

## [1.0.1](https://github.com/routup/routup/compare/v1.0.0...v1.0.1) (2023-05-29)


### Bug Fixes

* bump smob version to v1.4.x ([d42c7e9](https://github.com/routup/routup/commit/d42c7e97f3f1feeb3988b655bc3ad06531d9ad21))
* rename method constant to method-name ([5e42609](https://github.com/routup/routup/commit/5e4260939e9c28456b2336eccd6af117ff66fb9d))

# 1.0.0 (2023-05-15)


### Bug Fixes

* add additional type exports of trapi/swagger ([21e2973](https://github.com/routup/routup/commit/21e2973a27ab8cbb203f65b0f202d5a4e280a2bf))
* add append-response-header helper ([dc0b501](https://github.com/routup/routup/commit/dc0b5016271d2e93f26ae644847b15795bc2cd00))
* add missing export for mixed decorators ([a944a56](https://github.com/routup/routup/commit/a944a564dc4894f213ad6a510bbd514935bbcfd4))
* allow regexp or string for routing path ([f86ccca](https://github.com/routup/routup/commit/f86ccca6918a4924e0682137b505eb6c36b2bce6))
* **body:** set @types/body-parser as dependency instead of dev ([b794926](https://github.com/routup/routup/commit/b7949263ff5cc8e613917e49592436b05e49802e))
* building decorator method arguments ([e1d7139](https://github.com/routup/routup/commit/e1d7139e0fd5d89ed7535d067681e118bc3e7a68))
* change dependency from core to routup package ([b3f203a](https://github.com/routup/routup/commit/b3f203ac1a07190db6913620e620d8b930681e74))
* cleanup cookie and query handler + extended test suites ([1e46be9](https://github.com/routup/routup/commit/1e46be9ff907a1741e80e7135b5f00a984b410a2))
* **cookie:** expose parse- & serialize-options type ([1481e84](https://github.com/routup/routup/commit/1481e84f3ffea52a74884fc7b2a25c5ea181ff1f))
* **cookie:** set & unset helper ([f3f10ee](https://github.com/routup/routup/commit/f3f10ee43eb5b6ebd103b8f01cfff697774ec217))
* **core:** updated mime dependency ([591252b](https://github.com/routup/routup/commit/591252b369491d1cbfbef6b39fabdf8a271e170b))
* decorator parameter generation (return argument) ([71eb522](https://github.com/routup/routup/commit/71eb52285a642ff69d4bfa7afb703d11c0071418))
* **decorators:** add missing exports ([fe571e1](https://github.com/routup/routup/commit/fe571e10e229c4dd33060a446d7b20c60ed30901))
* **decorators:** better naming for bounding controller(s) to a router instance ([5ab435d](https://github.com/routup/routup/commit/5ab435d1f6b18fe3ed9e0c660df565f6907a900b))
* default export for output build ([7f9afbf](https://github.com/routup/routup/commit/7f9afbf6bf1266aeb90cffc2527d20b8a154b580))
* **deps:** bump @ebec/http from 0.1.0 to 0.2.2 ([#115](https://github.com/routup/routup/issues/115)) ([d4bf39d](https://github.com/routup/routup/commit/d4bf39db27f0d50a8c79c7856d993554ea94722f))
* **deps:** bump @ebec/http from 0.2.2 to 1.0.0 ([#197](https://github.com/routup/routup/issues/197)) ([5ec751c](https://github.com/routup/routup/commit/5ec751c9a2db6b02cc6396d6794d38c5b5e51445))
* **deps:** bump @trapi/swagger from 1.0.0-alpha.10 to 1.0.0-alpha.12 ([#194](https://github.com/routup/routup/issues/194)) ([7797c00](https://github.com/routup/routup/commit/7797c00ed396ce7932bbff652e6b4f434d35c90d))
* **deps:** bump body-parser from 1.20.1 to 1.20.2 ([#158](https://github.com/routup/routup/issues/158)) ([c23a434](https://github.com/routup/routup/commit/c23a434e75b6cf23ac94b80f05a41569f759ba65))
* **deps:** bump continu from 1.0.4 to 1.0.5 ([f4f63ea](https://github.com/routup/routup/commit/f4f63ea8d430571e4525cc64ce840af0368960b0))
* **deps:** bump continu from 1.0.5 to 1.3.1 ([#215](https://github.com/routup/routup/issues/215)) ([20e77df](https://github.com/routup/routup/commit/20e77df7ce2c9bdb4645195aa29724ec667f4628))
* **deps:** bump cookie-es from 0.5.0 to 1.0.0 ([#239](https://github.com/routup/routup/issues/239)) ([c5e7923](https://github.com/routup/routup/commit/c5e7923dab5d9d31f1a7d278d3708e8a5d2d5bcb))
* **deps:** bump cookiejar from 2.1.3 to 2.1.4 ([#98](https://github.com/routup/routup/issues/98)) ([24d9b19](https://github.com/routup/routup/commit/24d9b198211c824d6237178e2deeeaa1e0040e0b))
* **deps:** bump http-cache-semantics from 4.1.0 to 4.1.1 ([#122](https://github.com/routup/routup/issues/122)) ([2faeb37](https://github.com/routup/routup/commit/2faeb3799b220e559a23d8254d1914e67d544dad))
* **deps:** bump json5 and @tada5hi/eslint-config-vue-typescript ([7af8503](https://github.com/routup/routup/commit/7af8503789578a0dd89d78579c45dc08d1a217d6))
* **deps:** bump json5 from 1.0.1 to 1.0.2 ([4b27a1e](https://github.com/routup/routup/commit/4b27a1e8d3f7d09b410a3c9a16af6779012411d9))
* **deps:** bump luxon from 1.28.0 to 1.28.1 ([79fdaa4](https://github.com/routup/routup/commit/79fdaa4577fb1c0f69915527a5bed7a66fce2fcc))
* **deps:** bump peer-dependencies ([f353d3e](https://github.com/routup/routup/commit/f353d3e6e0c7f1752b66ba4c70302786e1216165))
* **deps:** bump qs from 6.11.0 to 6.11.1 ([#177](https://github.com/routup/routup/issues/177)) ([778a74b](https://github.com/routup/routup/commit/778a74bf46b01e2d981e8a7c3cae3c45c6e4427d))
* **deps:** bump smob from 0.0.6 to 0.0.7 ([ced5d39](https://github.com/routup/routup/commit/ced5d396edb9a242b037b895775e586ce946b134))
* **deps:** bump smob from 0.0.7 to 0.1.0 ([#120](https://github.com/routup/routup/issues/120)) ([5a83923](https://github.com/routup/routup/commit/5a839236ac72232cf1bf0ba693f8d193830876e4))
* **deps:** bump smob from 0.1.0 to 1.0.0 ([#198](https://github.com/routup/routup/issues/198)) ([9a5ca76](https://github.com/routup/routup/commit/9a5ca760e917ebd94a6e5025b0fc9edb635346c5))
* **deps:** bump swagger-ui-dist from 4.15.5 to 4.18.1 ([#176](https://github.com/routup/routup/issues/176)) ([d4c5423](https://github.com/routup/routup/commit/d4c54230fbe469387fde8b0a5685bb31523975c0))
* **deps:** bump swagger-ui-dist from 4.18.1 to 4.18.2 ([#222](https://github.com/routup/routup/issues/222)) ([ef6fd34](https://github.com/routup/routup/commit/ef6fd34aef5ff077565a25942b09bcf284b323ad))
* **deps:** bump swagger-ui-dist from 4.18.2 to 4.18.3 ([#249](https://github.com/routup/routup/issues/249)) ([82e4d06](https://github.com/routup/routup/commit/82e4d0630d468bc20a52a778e94b636d70d4c71e))
* **deps:** bump vitepress from 1.0.0-alpha.27 to 1.0.0-alpha.28 ([929c07b](https://github.com/routup/routup/commit/929c07b7a281ed0b76515345e1ebb2208653e0ba))
* **deps:** bump vitepress from 1.0.0-alpha.28 to 1.0.0-alpha.29 ([a8ba860](https://github.com/routup/routup/commit/a8ba8603b446e90b7cc4d23a5d42baed94b7cf17))
* **deps:** bump vitepress from 1.0.0-alpha.29 to 1.0.0-alpha.30 ([1e8ff5a](https://github.com/routup/routup/commit/1e8ff5a6b6591ce18ac1a906cd300fa15253ba89))
* **deps:** bump vitepress from 1.0.0-alpha.30 to 1.0.0-alpha.31 ([cfdfd0e](https://github.com/routup/routup/commit/cfdfd0eca5cbc805aeea8177a7152aee8822ba15))
* **deps:** bump vitepress from 1.0.0-alpha.31 to 1.0.0-alpha.32 ([dfb6268](https://github.com/routup/routup/commit/dfb6268b3f93cc1c300ed2e715b087a235103fcb))
* **deps:** bump vitepress from 1.0.0-alpha.32 to 1.0.0-alpha.33 ([36d1373](https://github.com/routup/routup/commit/36d1373ee17e2f98ff33f28121ffe242298538bc))
* **deps:** bump vitepress from 1.0.0-alpha.33 to 1.0.0-alpha.34 ([9916108](https://github.com/routup/routup/commit/9916108aa71ae34bfe9c9fa29887a3fde732f5c3))
* **deps:** bump vitepress from 1.0.0-alpha.34 to 1.0.0-alpha.35 ([c574246](https://github.com/routup/routup/commit/c5742469315e3260ba9bbb14c20728d48d579dba))
* **deps:** bump vitepress from 1.0.0-alpha.35 to 1.0.0-alpha.36 ([658ca12](https://github.com/routup/routup/commit/658ca122a4c28f2dd3d6daba5311234c6cc98f5e))
* **deps:** bump vitepress from 1.0.0-alpha.36 to 1.0.0-alpha.38 ([945cc76](https://github.com/routup/routup/commit/945cc7666f1d67e45761723be1b08208abac9fb6))
* **deps:** bump vitepress from 1.0.0-alpha.38 to 1.0.0-alpha.40 ([#96](https://github.com/routup/routup/issues/96)) ([aeeef16](https://github.com/routup/routup/commit/aeeef16dea3dfbaea3822355a1db625e8635ffa1))
* **deps:** bump vitepress from 1.0.0-alpha.40 to 1.0.0-alpha.44 ([#116](https://github.com/routup/routup/issues/116)) ([fc2f07c](https://github.com/routup/routup/commit/fc2f07ced8958f554eb781640b99a4cdc392c44e))
* **deps:** bump vitepress from 1.0.0-alpha.44 to 1.0.0-alpha.45 ([#119](https://github.com/routup/routup/issues/119)) ([305a9b1](https://github.com/routup/routup/commit/305a9b1beb01acad833bc5dce2a22f9a222bd2e1))
* **deps:** bump vitepress from 1.0.0-alpha.45 to 1.0.0-alpha.46 ([#139](https://github.com/routup/routup/issues/139)) ([26eb833](https://github.com/routup/routup/commit/26eb833709eef699643751912edd759da29f13ef))
* **deps:** bump vitepress from 1.0.0-alpha.46 to 1.0.0-alpha.51 ([#171](https://github.com/routup/routup/issues/171)) ([8b70827](https://github.com/routup/routup/commit/8b708275bd046e7f53888a9e0eb4f5b9b1c8e801))
* **deps:** bump vitepress from 1.0.0-alpha.51 to 1.0.0-alpha.54 ([#180](https://github.com/routup/routup/issues/180)) ([a5ef4a8](https://github.com/routup/routup/commit/a5ef4a8634bebddbd1de5e43732c8c8ff7fa4c2a))
* **deps:** bump vitepress from 1.0.0-alpha.54 to 1.0.0-alpha.60 ([#187](https://github.com/routup/routup/issues/187)) ([0cb2c8a](https://github.com/routup/routup/commit/0cb2c8a2e94bc4aebe599080ed7ea99a0137cde2))
* **deps:** bump vitepress from 1.0.0-alpha.60 to 1.0.0-alpha.64 ([#209](https://github.com/routup/routup/issues/209)) ([d17f55a](https://github.com/routup/routup/commit/d17f55a7462a83d51cf29e65965d5d6817f619fa))
* **deps:** bump vitepress from 1.0.0-alpha.64 to 1.0.0-alpha.72 ([#218](https://github.com/routup/routup/issues/218)) ([0338672](https://github.com/routup/routup/commit/0338672083c81e461a430eb8e9b35c7b9932ca96))
* **deps:** bump vitepress from 1.0.0-alpha.72 to 1.0.0-alpha.75 ([#250](https://github.com/routup/routup/issues/250)) ([01a699d](https://github.com/routup/routup/commit/01a699dd064b9ec1e50d9208331d4f7a3f5ef940))
* **deps:** bump vue from 3.2.41 to 3.2.43 ([72968b9](https://github.com/routup/routup/commit/72968b9ddd5a226cd71d860c780146ea11b5352a))
* **deps:** bump vue from 3.2.43 to 3.2.44 ([f0605ca](https://github.com/routup/routup/commit/f0605ca42e316ea74e994ec208f0b7dae32781ba))
* **deps:** bump vue from 3.2.44 to 3.2.45 ([ce76edd](https://github.com/routup/routup/commit/ce76edd41f3c539ae700c7dfb2ac8170f7dc5d38))
* **deps:** bump vue from 3.2.45 to 3.2.47 ([#126](https://github.com/routup/routup/issues/126)) ([dd7631b](https://github.com/routup/routup/commit/dd7631bce104dc1926e45ddd4ac4c00288e912aa))
* **deps:** bump vue from 3.2.47 to 3.3.1 ([#241](https://github.com/routup/routup/issues/241)) ([7ab5c32](https://github.com/routup/routup/commit/7ab5c32b67192d63a050be3b74f3b02fdbe11aba))
* **deps:** bump zod from 3.19.1 to 3.20.0 ([0a92156](https://github.com/routup/routup/commit/0a9215612fd3c66a2a2659e8b8dd326cf654cfad))
* **deps:** bump zod from 3.20.0 to 3.20.2 ([263a600](https://github.com/routup/routup/commit/263a600f634d95d78a2f3276ab34cfced9f634db))
* **deps:** bump zod from 3.20.2 to 3.20.3 ([#133](https://github.com/routup/routup/issues/133)) ([386fec6](https://github.com/routup/routup/commit/386fec6ec9f1415f832e71bc971178af5694adae))
* **deps:** bump zod from 3.20.3 to 3.20.6 ([#135](https://github.com/routup/routup/issues/135)) ([c575c2f](https://github.com/routup/routup/commit/c575c2f1a210b310f81f7c3a57289b8158925418))
* **deps:** bump zod from 3.20.6 to 3.21.4 ([#174](https://github.com/routup/routup/issues/174)) ([356df0f](https://github.com/routup/routup/commit/356df0ff13e2378fc5961e371c63fb90b76aff4b))
* **deps:** updated linting & tsconfig preset ([269685d](https://github.com/routup/routup/commit/269685d395bcb46ec71430b284c7a8a9ca363063))
* exceeding of byte range for file streaming + added tests ([bec5b1b](https://github.com/routup/routup/commit/bec5b1bdf5186410937a324120a36bf245f73f87))
* export is-file-url ([fabe1fd](https://github.com/routup/routup/commit/fabe1fd008bcab1a8391acef5cd3b24ebc7b15ba))
* move is-object util ([1060f66](https://github.com/routup/routup/commit/1060f668316f1edecc629d1eb255a245486381c5))
* peer-dependency definition for trapi/swagger ([b2c374c](https://github.com/routup/routup/commit/b2c374c5785bd39ec11b8e0da79755f5390880c1))
* peer-dependency reference ([243552b](https://github.com/routup/routup/commit/243552b1e1982237fed259045fd88cfc565d9991))
* prefix node modules imports with node: ([a45055a](https://github.com/routup/routup/commit/a45055a15d09e4e299c6772ff2d385f9f62468ad))
* **prometheus:** capture duration for both metrics in sec ([8458cd3](https://github.com/routup/routup/commit/8458cd387cacc750119d84cff2be7645e171777f))
* remove cookie/query fn setter ([eb9c6c1](https://github.com/routup/routup/commit/eb9c6c1d60d8373a17614bde7499043f98a1bae0))
* rename decorator meta fn parameter ([be47a68](https://github.com/routup/routup/commit/be47a6867dc7eaa3196ad83b39d1b7c987a00def))
* renamed getRequestIp to getRequestIP ([8bf44c9](https://github.com/routup/routup/commit/8bf44c9de5bbbeaab03bbafd761f3ccd242487fe))
* **routup:** add missing export + minor README.md fix ([29e3905](https://github.com/routup/routup/commit/29e39052ced2de1783af2ffa16ef95f26b4c5fb0))
* **routup:** add missing handler export ([596b76c](https://github.com/routup/routup/commit/596b76c1c318acf9a5dc1b52410b3eaffe27776b))
* **routup:** add missing res helper exports ([b78e4af](https://github.com/routup/routup/commit/b78e4af3ef228f893b44c8e68d2cfd2d6722ff4f))
* **routup:** add tiny acepted & created response send helpers ([afa4297](https://github.com/routup/routup/commit/afa429757602a42991f7061c28ceabb4260dc1d6))
* **routup:** enhance patch matching for route methods ([188e07a](https://github.com/routup/routup/commit/188e07ab00eb65ee69a97391e436cee017925f25))
* **routup:** handle thrown route middleware error correctly ([43354cb](https://github.com/routup/routup/commit/43354cba99ff1c24f91f3d734e9c1b6170996532))
* **routup:** only timeout request if options is set ([e806d92](https://github.com/routup/routup/commit/e806d92f32c253490b6aeaa6f67bce321f663557))
* **routup:** process handler execution output ([f6d14cb](https://github.com/routup/routup/commit/f6d14cb5e9a7f267a93e382d0b130c66ffca0db2))
* **routup:** remove unnecessary import statement ([50b7069](https://github.com/routup/routup/commit/50b706933d17113a9158183c4b86d6ba6301149f))
* **routup:** set 400 (instead 500) status-code if handler throws error ([9d8d509](https://github.com/routup/routup/commit/9d8d509f3cfc0333525efb57d8721a2f0883d3e9))
* **routup:** use case-sensitive option for path matcher ([e8af7e4](https://github.com/routup/routup/commit/e8af7e4c16e44240862c185d12aee1e06c1a68b9))
* **routup:** use static error option constants ([109da37](https://github.com/routup/routup/commit/109da379286b81dc7e8ca1e63c7103119fa8a027))
* separate set/extend body payload + added fn overloading for cookie & query ([c27dde4](https://github.com/routup/routup/commit/c27dde43b47f00b4426ff155e9ea57b04c420982))
* **static:** add missing return statement ([85cfe01](https://github.com/routup/routup/commit/85cfe01a7f2f4c10199394cd5eb56839ab28cacb))
* **static:** minor fix for etag check ([ce21ec2](https://github.com/routup/routup/commit/ce21ec2fd7264c116c99d773c73caeaf12bbdbae))
* **static:** minor pattern match issues + uri decoding ([f2d2fd2](https://github.com/routup/routup/commit/f2d2fd26c3da6ee8ac9f10e90ff170b5fb6ebbc5))
* **swager:** remove console import ([93f0d8e](https://github.com/routup/routup/commit/93f0d8e1aa621dd85e8b1ebf98fc38c8d3946578))
* **swagger:** assets path resolution ([84b62b8](https://github.com/routup/routup/commit/84b62b8e643b243eaf216c2ce4731f605ce22cf4))
* **urf:** nested routing + added few test cases ([53d26c0](https://github.com/routup/routup/commit/53d26c00591752fa5187a304e65626aa8c84cffe))
* use sub-package for eslint configuration ([26e8546](https://github.com/routup/routup/commit/26e8546e81729ed75a1e6bc142b92252c23f0b2d))


### Features

* add cache & cookie helper ([b20c6f2](https://github.com/routup/routup/commit/b20c6f2f838e7fbf9cb971294135cd3150675de3))
* add send-format helper + test suite ([2a7b0d5](https://github.com/routup/routup/commit/2a7b0d59e16bb3f867617bc54360a349b7526013))
* add static-middleware plugin ([ae633a1](https://github.com/routup/routup/commit/ae633a18530a236257780c0a4bffc926f93381a1))
* add swagger generator for api endpoints ([c8ff8a7](https://github.com/routup/routup/commit/c8ff8a78c4e0e8b6399db567ce8b882bac2c1e83))
* **body:** add body use & set helper ([a7017b7](https://github.com/routup/routup/commit/a7017b7118f5fe215641b0e7d6c841b5fa2b7b4f))
* **body:** add expermintal decorator support ([accf1fd](https://github.com/routup/routup/commit/accf1fd518fd301705175545070c7a2a185b2b99))
* bump version ([4d3fce2](https://github.com/routup/routup/commit/4d3fce2941ce56fa86dc789b81021fffb4a5424c))
* cache request path + extended header constants ([78e039c](https://github.com/routup/routup/commit/78e039c685e12ce64ada04324ac177b649ef3cde))
* **cookie:** add expermintal decorator support ([5af6a50](https://github.com/routup/routup/commit/5af6a5015cd743dff5cabe3f10f7fdcfe1dd4a58))
* **core:** allow range specification for file streaming ([42e93a4](https://github.com/routup/routup/commit/42e93a4f0825909a5c41c1d74e7a251b3257a048))
* create cjs & esm bundle ([5c13568](https://github.com/routup/routup/commit/5c135687d9dc6e7c38905d8e742029064454ab43))
* make request-handler optional for cookie- & query-plugin ([ac07d25](https://github.com/routup/routup/commit/ac07d2592a16de1dafaa5d78b9ba805e3a5d3da9))
* merge core & routup package ([45c32fb](https://github.com/routup/routup/commit/45c32fb839cd345b6c79fe3b33a424ffd4eee830))
* minor internal api changes ([83b46e5](https://github.com/routup/routup/commit/83b46e5f2d09bf58ced2e9e8dc9a8637106746b7))
* new decorator(s) package/plugin ([511524c](https://github.com/routup/routup/commit/511524c854f5cdb7222b4cdea2a252a57c2007d1))
* prefix node module imports + replaced smob is-object with local implementation ([70a1a21](https://github.com/routup/routup/commit/70a1a219737fa26224e5494cf74d548712362ea4))
* **prometheus:** initialized new prometheus plugin ([d41c7ad](https://github.com/routup/routup/commit/d41c7ad82de422e6e6d07da3308cf53ca8078ea8))
* **query:** add expermintal decorator support ([776c78a](https://github.com/routup/routup/commit/776c78acc2e7166747bd4e4eb6a78b825dd798f1))
* **rate-limit-redis:** initial release ([5442233](https://github.com/routup/routup/commit/5442233bfe9ff40419a0b281b934549bb6cc945d))
* **rate-limit:** better options type naming ([bae4288](https://github.com/routup/routup/commit/bae4288aab78a9f600317f4a89dcf59740475c0b))
* **rate-limit:** new package for rate-limit ([7d1c2da](https://github.com/routup/routup/commit/7d1c2dab5826f8bc1d251bef323e5bd93ebf3a77))
* replaced rollup,esbuild & ts-jest with swc ([eec4671](https://github.com/routup/routup/commit/eec46710781894532b9be0b0b9d1b911f0c7e937))
* **routup:** add experimental decroator support ([6c00303](https://github.com/routup/routup/commit/6c00303c25dd06248057d9b98bee7b3e855c1c94))
* **routup:** add request hostname helper fn ([556a79a](https://github.com/routup/routup/commit/556a79a8b6c318565a2e9ffd1b3906faa15b3edb))
* **routup:** add request ip helper fn ([70cdf12](https://github.com/routup/routup/commit/70cdf120fb6db7efb688f716dedb41e5553bbcd8))
* **routup:** add request protocol helper fn ([4516174](https://github.com/routup/routup/commit/451617480ec3991412b76b1e0bb481627c231f61))
* **routup:** add support for head & options requests ([9dd0010](https://github.com/routup/routup/commit/9dd001049f2b2861aa1c6764dcaca560db243d50))
* **routup:** better naming & splitting for request header helpers ([2883c68](https://github.com/routup/routup/commit/2883c681e9828897ec4426fcad2e47827a0b90d5))
* **routup:** enhanced config container + add validations ([8d9cb7f](https://github.com/routup/routup/commit/8d9cb7fe9769d04bd779eb42d6b1bc5facbeeb0d))
* **routup:** global config container to manage options ([208be22](https://github.com/routup/routup/commit/208be2279d1cb6b6877417e133a2b20bc8314793))
* **routup:** use set-immediate to increase concurrent connections ([c240659](https://github.com/routup/routup/commit/c24065952c8c9bf4c804e5c87924166064a9f9ed))
* serve swagger ui template on paths with no trail slash ([da780dd](https://github.com/routup/routup/commit/da780dd4b424a2a11311fa04dfe1d3e4cdb8abc8))
* **static:** ignore-pattern option to prevent serving specific files ([2d4ed0c](https://github.com/routup/routup/commit/2d4ed0ca6cdd82671e0d26a6ca33b2fb9ffaa9de))
* **static:** optimized file scanning ([dd55bbd](https://github.com/routup/routup/commit/dd55bbdee65d793c8cb71bfaed6e6b0f9b6263bd))
* **swagger:** avoid import of swagger-ui-dist ([f0066fe](https://github.com/routup/routup/commit/f0066fe03e00405fb7a1c6039ad572e9c8d4621a))
* **swagger:** initialise project + ui submodule ([48c4944](https://github.com/routup/routup/commit/48c4944241a42a49f0ff2e530b5f875e09470ed9))
* **swagger:** remove resolve-package-path dependency ([d3df1b7](https://github.com/routup/routup/commit/d3df1b77b3d7edd367bdaf7c1efedff02fb782ab))
* use rollup + swc for transpiling and bundle code for esm/cjs ([aeabf06](https://github.com/routup/routup/commit/aeabf06d2372f315bdbe33546ea5dacb74ce6d9d))


### BREAKING CHANGES

* Public API changed

# [1.0.0-alpha.6](https://github.com/routup/routup/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2023-05-15)


### Bug Fixes

* separate set/extend body payload + added fn overloading for cookie & query ([c27dde4](https://github.com/routup/routup/commit/c27dde43b47f00b4426ff155e9ea57b04c420982))

# [1.0.0-alpha.5](https://github.com/routup/routup/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2023-05-15)


### Bug Fixes

* remove cookie/query fn setter ([eb9c6c1](https://github.com/routup/routup/commit/eb9c6c1d60d8373a17614bde7499043f98a1bae0))

# [1.0.0-alpha.4](https://github.com/routup/routup/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2023-05-15)


### Bug Fixes

* cleanup cookie and query handler + extended test suites ([1e46be9](https://github.com/routup/routup/commit/1e46be9ff907a1741e80e7135b5f00a984b410a2))

# [1.0.0-alpha.3](https://github.com/routup/routup/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2023-05-14)


### Bug Fixes

* exceeding of byte range for file streaming + added tests ([bec5b1b](https://github.com/routup/routup/commit/bec5b1bdf5186410937a324120a36bf245f73f87))


### Features

* add send-format helper + test suite ([2a7b0d5](https://github.com/routup/routup/commit/2a7b0d59e16bb3f867617bc54360a349b7526013))

# [1.0.0-alpha.2](https://github.com/routup/routup/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2023-05-13)


### Bug Fixes

* default export for output build ([7f9afbf](https://github.com/routup/routup/commit/7f9afbf6bf1266aeb90cffc2527d20b8a154b580))

# 1.0.0-alpha.1 (2023-05-13)


### Bug Fixes

* add additional type exports of trapi/swagger ([21e2973](https://github.com/routup/routup/commit/21e2973a27ab8cbb203f65b0f202d5a4e280a2bf))
* add append-response-header helper ([dc0b501](https://github.com/routup/routup/commit/dc0b5016271d2e93f26ae644847b15795bc2cd00))
* add missing export for mixed decorators ([a944a56](https://github.com/routup/routup/commit/a944a564dc4894f213ad6a510bbd514935bbcfd4))
* allow regexp or string for routing path ([f86ccca](https://github.com/routup/routup/commit/f86ccca6918a4924e0682137b505eb6c36b2bce6))
* **body:** set @types/body-parser as dependency instead of dev ([b794926](https://github.com/routup/routup/commit/b7949263ff5cc8e613917e49592436b05e49802e))
* building decorator method arguments ([e1d7139](https://github.com/routup/routup/commit/e1d7139e0fd5d89ed7535d067681e118bc3e7a68))
* change dependency from core to routup package ([b3f203a](https://github.com/routup/routup/commit/b3f203ac1a07190db6913620e620d8b930681e74))
* **cookie:** expose parse- & serialize-options type ([1481e84](https://github.com/routup/routup/commit/1481e84f3ffea52a74884fc7b2a25c5ea181ff1f))
* **cookie:** set & unset helper ([f3f10ee](https://github.com/routup/routup/commit/f3f10ee43eb5b6ebd103b8f01cfff697774ec217))
* **core:** updated mime dependency ([591252b](https://github.com/routup/routup/commit/591252b369491d1cbfbef6b39fabdf8a271e170b))
* decorator parameter generation (return argument) ([71eb522](https://github.com/routup/routup/commit/71eb52285a642ff69d4bfa7afb703d11c0071418))
* **decorators:** add missing exports ([fe571e1](https://github.com/routup/routup/commit/fe571e10e229c4dd33060a446d7b20c60ed30901))
* **decorators:** better naming for bounding controller(s) to a router instance ([5ab435d](https://github.com/routup/routup/commit/5ab435d1f6b18fe3ed9e0c660df565f6907a900b))
* **deps:** bump @ebec/http from 0.1.0 to 0.2.2 ([#115](https://github.com/routup/routup/issues/115)) ([d4bf39d](https://github.com/routup/routup/commit/d4bf39db27f0d50a8c79c7856d993554ea94722f))
* **deps:** bump @ebec/http from 0.2.2 to 1.0.0 ([#197](https://github.com/routup/routup/issues/197)) ([5ec751c](https://github.com/routup/routup/commit/5ec751c9a2db6b02cc6396d6794d38c5b5e51445))
* **deps:** bump @trapi/swagger from 1.0.0-alpha.10 to 1.0.0-alpha.12 ([#194](https://github.com/routup/routup/issues/194)) ([7797c00](https://github.com/routup/routup/commit/7797c00ed396ce7932bbff652e6b4f434d35c90d))
* **deps:** bump body-parser from 1.20.1 to 1.20.2 ([#158](https://github.com/routup/routup/issues/158)) ([c23a434](https://github.com/routup/routup/commit/c23a434e75b6cf23ac94b80f05a41569f759ba65))
* **deps:** bump continu from 1.0.4 to 1.0.5 ([f4f63ea](https://github.com/routup/routup/commit/f4f63ea8d430571e4525cc64ce840af0368960b0))
* **deps:** bump continu from 1.0.5 to 1.3.1 ([#215](https://github.com/routup/routup/issues/215)) ([20e77df](https://github.com/routup/routup/commit/20e77df7ce2c9bdb4645195aa29724ec667f4628))
* **deps:** bump cookie-es from 0.5.0 to 1.0.0 ([#239](https://github.com/routup/routup/issues/239)) ([c5e7923](https://github.com/routup/routup/commit/c5e7923dab5d9d31f1a7d278d3708e8a5d2d5bcb))
* **deps:** bump cookiejar from 2.1.3 to 2.1.4 ([#98](https://github.com/routup/routup/issues/98)) ([24d9b19](https://github.com/routup/routup/commit/24d9b198211c824d6237178e2deeeaa1e0040e0b))
* **deps:** bump http-cache-semantics from 4.1.0 to 4.1.1 ([#122](https://github.com/routup/routup/issues/122)) ([2faeb37](https://github.com/routup/routup/commit/2faeb3799b220e559a23d8254d1914e67d544dad))
* **deps:** bump json5 and @tada5hi/eslint-config-vue-typescript ([7af8503](https://github.com/routup/routup/commit/7af8503789578a0dd89d78579c45dc08d1a217d6))
* **deps:** bump json5 from 1.0.1 to 1.0.2 ([4b27a1e](https://github.com/routup/routup/commit/4b27a1e8d3f7d09b410a3c9a16af6779012411d9))
* **deps:** bump luxon from 1.28.0 to 1.28.1 ([79fdaa4](https://github.com/routup/routup/commit/79fdaa4577fb1c0f69915527a5bed7a66fce2fcc))
* **deps:** bump peer-dependencies ([f353d3e](https://github.com/routup/routup/commit/f353d3e6e0c7f1752b66ba4c70302786e1216165))
* **deps:** bump qs from 6.11.0 to 6.11.1 ([#177](https://github.com/routup/routup/issues/177)) ([778a74b](https://github.com/routup/routup/commit/778a74bf46b01e2d981e8a7c3cae3c45c6e4427d))
* **deps:** bump smob from 0.0.6 to 0.0.7 ([ced5d39](https://github.com/routup/routup/commit/ced5d396edb9a242b037b895775e586ce946b134))
* **deps:** bump smob from 0.0.7 to 0.1.0 ([#120](https://github.com/routup/routup/issues/120)) ([5a83923](https://github.com/routup/routup/commit/5a839236ac72232cf1bf0ba693f8d193830876e4))
* **deps:** bump smob from 0.1.0 to 1.0.0 ([#198](https://github.com/routup/routup/issues/198)) ([9a5ca76](https://github.com/routup/routup/commit/9a5ca760e917ebd94a6e5025b0fc9edb635346c5))
* **deps:** bump swagger-ui-dist from 4.15.5 to 4.18.1 ([#176](https://github.com/routup/routup/issues/176)) ([d4c5423](https://github.com/routup/routup/commit/d4c54230fbe469387fde8b0a5685bb31523975c0))
* **deps:** bump swagger-ui-dist from 4.18.1 to 4.18.2 ([#222](https://github.com/routup/routup/issues/222)) ([ef6fd34](https://github.com/routup/routup/commit/ef6fd34aef5ff077565a25942b09bcf284b323ad))
* **deps:** bump swagger-ui-dist from 4.18.2 to 4.18.3 ([#249](https://github.com/routup/routup/issues/249)) ([82e4d06](https://github.com/routup/routup/commit/82e4d0630d468bc20a52a778e94b636d70d4c71e))
* **deps:** bump vitepress from 1.0.0-alpha.27 to 1.0.0-alpha.28 ([929c07b](https://github.com/routup/routup/commit/929c07b7a281ed0b76515345e1ebb2208653e0ba))
* **deps:** bump vitepress from 1.0.0-alpha.28 to 1.0.0-alpha.29 ([a8ba860](https://github.com/routup/routup/commit/a8ba8603b446e90b7cc4d23a5d42baed94b7cf17))
* **deps:** bump vitepress from 1.0.0-alpha.29 to 1.0.0-alpha.30 ([1e8ff5a](https://github.com/routup/routup/commit/1e8ff5a6b6591ce18ac1a906cd300fa15253ba89))
* **deps:** bump vitepress from 1.0.0-alpha.30 to 1.0.0-alpha.31 ([cfdfd0e](https://github.com/routup/routup/commit/cfdfd0eca5cbc805aeea8177a7152aee8822ba15))
* **deps:** bump vitepress from 1.0.0-alpha.31 to 1.0.0-alpha.32 ([dfb6268](https://github.com/routup/routup/commit/dfb6268b3f93cc1c300ed2e715b087a235103fcb))
* **deps:** bump vitepress from 1.0.0-alpha.32 to 1.0.0-alpha.33 ([36d1373](https://github.com/routup/routup/commit/36d1373ee17e2f98ff33f28121ffe242298538bc))
* **deps:** bump vitepress from 1.0.0-alpha.33 to 1.0.0-alpha.34 ([9916108](https://github.com/routup/routup/commit/9916108aa71ae34bfe9c9fa29887a3fde732f5c3))
* **deps:** bump vitepress from 1.0.0-alpha.34 to 1.0.0-alpha.35 ([c574246](https://github.com/routup/routup/commit/c5742469315e3260ba9bbb14c20728d48d579dba))
* **deps:** bump vitepress from 1.0.0-alpha.35 to 1.0.0-alpha.36 ([658ca12](https://github.com/routup/routup/commit/658ca122a4c28f2dd3d6daba5311234c6cc98f5e))
* **deps:** bump vitepress from 1.0.0-alpha.36 to 1.0.0-alpha.38 ([945cc76](https://github.com/routup/routup/commit/945cc7666f1d67e45761723be1b08208abac9fb6))
* **deps:** bump vitepress from 1.0.0-alpha.38 to 1.0.0-alpha.40 ([#96](https://github.com/routup/routup/issues/96)) ([aeeef16](https://github.com/routup/routup/commit/aeeef16dea3dfbaea3822355a1db625e8635ffa1))
* **deps:** bump vitepress from 1.0.0-alpha.40 to 1.0.0-alpha.44 ([#116](https://github.com/routup/routup/issues/116)) ([fc2f07c](https://github.com/routup/routup/commit/fc2f07ced8958f554eb781640b99a4cdc392c44e))
* **deps:** bump vitepress from 1.0.0-alpha.44 to 1.0.0-alpha.45 ([#119](https://github.com/routup/routup/issues/119)) ([305a9b1](https://github.com/routup/routup/commit/305a9b1beb01acad833bc5dce2a22f9a222bd2e1))
* **deps:** bump vitepress from 1.0.0-alpha.45 to 1.0.0-alpha.46 ([#139](https://github.com/routup/routup/issues/139)) ([26eb833](https://github.com/routup/routup/commit/26eb833709eef699643751912edd759da29f13ef))
* **deps:** bump vitepress from 1.0.0-alpha.46 to 1.0.0-alpha.51 ([#171](https://github.com/routup/routup/issues/171)) ([8b70827](https://github.com/routup/routup/commit/8b708275bd046e7f53888a9e0eb4f5b9b1c8e801))
* **deps:** bump vitepress from 1.0.0-alpha.51 to 1.0.0-alpha.54 ([#180](https://github.com/routup/routup/issues/180)) ([a5ef4a8](https://github.com/routup/routup/commit/a5ef4a8634bebddbd1de5e43732c8c8ff7fa4c2a))
* **deps:** bump vitepress from 1.0.0-alpha.54 to 1.0.0-alpha.60 ([#187](https://github.com/routup/routup/issues/187)) ([0cb2c8a](https://github.com/routup/routup/commit/0cb2c8a2e94bc4aebe599080ed7ea99a0137cde2))
* **deps:** bump vitepress from 1.0.0-alpha.60 to 1.0.0-alpha.64 ([#209](https://github.com/routup/routup/issues/209)) ([d17f55a](https://github.com/routup/routup/commit/d17f55a7462a83d51cf29e65965d5d6817f619fa))
* **deps:** bump vitepress from 1.0.0-alpha.64 to 1.0.0-alpha.72 ([#218](https://github.com/routup/routup/issues/218)) ([0338672](https://github.com/routup/routup/commit/0338672083c81e461a430eb8e9b35c7b9932ca96))
* **deps:** bump vitepress from 1.0.0-alpha.72 to 1.0.0-alpha.75 ([#250](https://github.com/routup/routup/issues/250)) ([01a699d](https://github.com/routup/routup/commit/01a699dd064b9ec1e50d9208331d4f7a3f5ef940))
* **deps:** bump vue from 3.2.41 to 3.2.43 ([72968b9](https://github.com/routup/routup/commit/72968b9ddd5a226cd71d860c780146ea11b5352a))
* **deps:** bump vue from 3.2.43 to 3.2.44 ([f0605ca](https://github.com/routup/routup/commit/f0605ca42e316ea74e994ec208f0b7dae32781ba))
* **deps:** bump vue from 3.2.44 to 3.2.45 ([ce76edd](https://github.com/routup/routup/commit/ce76edd41f3c539ae700c7dfb2ac8170f7dc5d38))
* **deps:** bump vue from 3.2.45 to 3.2.47 ([#126](https://github.com/routup/routup/issues/126)) ([dd7631b](https://github.com/routup/routup/commit/dd7631bce104dc1926e45ddd4ac4c00288e912aa))
* **deps:** bump vue from 3.2.47 to 3.3.1 ([#241](https://github.com/routup/routup/issues/241)) ([7ab5c32](https://github.com/routup/routup/commit/7ab5c32b67192d63a050be3b74f3b02fdbe11aba))
* **deps:** bump zod from 3.19.1 to 3.20.0 ([0a92156](https://github.com/routup/routup/commit/0a9215612fd3c66a2a2659e8b8dd326cf654cfad))
* **deps:** bump zod from 3.20.0 to 3.20.2 ([263a600](https://github.com/routup/routup/commit/263a600f634d95d78a2f3276ab34cfced9f634db))
* **deps:** bump zod from 3.20.2 to 3.20.3 ([#133](https://github.com/routup/routup/issues/133)) ([386fec6](https://github.com/routup/routup/commit/386fec6ec9f1415f832e71bc971178af5694adae))
* **deps:** bump zod from 3.20.3 to 3.20.6 ([#135](https://github.com/routup/routup/issues/135)) ([c575c2f](https://github.com/routup/routup/commit/c575c2f1a210b310f81f7c3a57289b8158925418))
* **deps:** bump zod from 3.20.6 to 3.21.4 ([#174](https://github.com/routup/routup/issues/174)) ([356df0f](https://github.com/routup/routup/commit/356df0ff13e2378fc5961e371c63fb90b76aff4b))
* **deps:** updated linting & tsconfig preset ([269685d](https://github.com/routup/routup/commit/269685d395bcb46ec71430b284c7a8a9ca363063))
* export is-file-url ([fabe1fd](https://github.com/routup/routup/commit/fabe1fd008bcab1a8391acef5cd3b24ebc7b15ba))
* move is-object util ([1060f66](https://github.com/routup/routup/commit/1060f668316f1edecc629d1eb255a245486381c5))
* peer-dependency definition for trapi/swagger ([b2c374c](https://github.com/routup/routup/commit/b2c374c5785bd39ec11b8e0da79755f5390880c1))
* peer-dependency reference ([243552b](https://github.com/routup/routup/commit/243552b1e1982237fed259045fd88cfc565d9991))
* prefix node modules imports with node: ([a45055a](https://github.com/routup/routup/commit/a45055a15d09e4e299c6772ff2d385f9f62468ad))
* **prometheus:** capture duration for both metrics in sec ([8458cd3](https://github.com/routup/routup/commit/8458cd387cacc750119d84cff2be7645e171777f))
* rename decorator meta fn parameter ([be47a68](https://github.com/routup/routup/commit/be47a6867dc7eaa3196ad83b39d1b7c987a00def))
* renamed getRequestIp to getRequestIP ([8bf44c9](https://github.com/routup/routup/commit/8bf44c9de5bbbeaab03bbafd761f3ccd242487fe))
* **routup:** add missing export + minor README.md fix ([29e3905](https://github.com/routup/routup/commit/29e39052ced2de1783af2ffa16ef95f26b4c5fb0))
* **routup:** add missing handler export ([596b76c](https://github.com/routup/routup/commit/596b76c1c318acf9a5dc1b52410b3eaffe27776b))
* **routup:** add missing res helper exports ([b78e4af](https://github.com/routup/routup/commit/b78e4af3ef228f893b44c8e68d2cfd2d6722ff4f))
* **routup:** add tiny acepted & created response send helpers ([afa4297](https://github.com/routup/routup/commit/afa429757602a42991f7061c28ceabb4260dc1d6))
* **routup:** enhance patch matching for route methods ([188e07a](https://github.com/routup/routup/commit/188e07ab00eb65ee69a97391e436cee017925f25))
* **routup:** handle thrown route middleware error correctly ([43354cb](https://github.com/routup/routup/commit/43354cba99ff1c24f91f3d734e9c1b6170996532))
* **routup:** only timeout request if options is set ([e806d92](https://github.com/routup/routup/commit/e806d92f32c253490b6aeaa6f67bce321f663557))
* **routup:** process handler execution output ([f6d14cb](https://github.com/routup/routup/commit/f6d14cb5e9a7f267a93e382d0b130c66ffca0db2))
* **routup:** remove unnecessary import statement ([50b7069](https://github.com/routup/routup/commit/50b706933d17113a9158183c4b86d6ba6301149f))
* **routup:** set 400 (instead 500) status-code if handler throws error ([9d8d509](https://github.com/routup/routup/commit/9d8d509f3cfc0333525efb57d8721a2f0883d3e9))
* **routup:** use case-sensitive option for path matcher ([e8af7e4](https://github.com/routup/routup/commit/e8af7e4c16e44240862c185d12aee1e06c1a68b9))
* **routup:** use static error option constants ([109da37](https://github.com/routup/routup/commit/109da379286b81dc7e8ca1e63c7103119fa8a027))
* **static:** add missing return statement ([85cfe01](https://github.com/routup/routup/commit/85cfe01a7f2f4c10199394cd5eb56839ab28cacb))
* **static:** minor fix for etag check ([ce21ec2](https://github.com/routup/routup/commit/ce21ec2fd7264c116c99d773c73caeaf12bbdbae))
* **static:** minor pattern match issues + uri decoding ([f2d2fd2](https://github.com/routup/routup/commit/f2d2fd26c3da6ee8ac9f10e90ff170b5fb6ebbc5))
* **swager:** remove console import ([93f0d8e](https://github.com/routup/routup/commit/93f0d8e1aa621dd85e8b1ebf98fc38c8d3946578))
* **swagger:** assets path resolution ([84b62b8](https://github.com/routup/routup/commit/84b62b8e643b243eaf216c2ce4731f605ce22cf4))
* **urf:** nested routing + added few test cases ([53d26c0](https://github.com/routup/routup/commit/53d26c00591752fa5187a304e65626aa8c84cffe))
* use sub-package for eslint configuration ([26e8546](https://github.com/routup/routup/commit/26e8546e81729ed75a1e6bc142b92252c23f0b2d))


### Features

* add cache & cookie helper ([b20c6f2](https://github.com/routup/routup/commit/b20c6f2f838e7fbf9cb971294135cd3150675de3))
* add static-middleware plugin ([ae633a1](https://github.com/routup/routup/commit/ae633a18530a236257780c0a4bffc926f93381a1))
* add swagger generator for api endpoints ([c8ff8a7](https://github.com/routup/routup/commit/c8ff8a78c4e0e8b6399db567ce8b882bac2c1e83))
* **body:** add body use & set helper ([a7017b7](https://github.com/routup/routup/commit/a7017b7118f5fe215641b0e7d6c841b5fa2b7b4f))
* **body:** add expermintal decorator support ([accf1fd](https://github.com/routup/routup/commit/accf1fd518fd301705175545070c7a2a185b2b99))
* bump version ([4d3fce2](https://github.com/routup/routup/commit/4d3fce2941ce56fa86dc789b81021fffb4a5424c))
* **cookie:** add expermintal decorator support ([5af6a50](https://github.com/routup/routup/commit/5af6a5015cd743dff5cabe3f10f7fdcfe1dd4a58))
* **core:** allow range specification for file streaming ([42e93a4](https://github.com/routup/routup/commit/42e93a4f0825909a5c41c1d74e7a251b3257a048))
* create cjs & esm bundle ([5c13568](https://github.com/routup/routup/commit/5c135687d9dc6e7c38905d8e742029064454ab43))
* make request-handler optional for cookie- & query-plugin ([ac07d25](https://github.com/routup/routup/commit/ac07d2592a16de1dafaa5d78b9ba805e3a5d3da9))
* merge core & routup package ([45c32fb](https://github.com/routup/routup/commit/45c32fb839cd345b6c79fe3b33a424ffd4eee830))
* minor internal api changes ([83b46e5](https://github.com/routup/routup/commit/83b46e5f2d09bf58ced2e9e8dc9a8637106746b7))
* new decorator(s) package/plugin ([511524c](https://github.com/routup/routup/commit/511524c854f5cdb7222b4cdea2a252a57c2007d1))
* prefix node module imports + replaced smob is-object with local implementation ([70a1a21](https://github.com/routup/routup/commit/70a1a219737fa26224e5494cf74d548712362ea4))
* **prometheus:** initialized new prometheus plugin ([d41c7ad](https://github.com/routup/routup/commit/d41c7ad82de422e6e6d07da3308cf53ca8078ea8))
* **query:** add expermintal decorator support ([776c78a](https://github.com/routup/routup/commit/776c78acc2e7166747bd4e4eb6a78b825dd798f1))
* **rate-limit-redis:** initial release ([5442233](https://github.com/routup/routup/commit/5442233bfe9ff40419a0b281b934549bb6cc945d))
* **rate-limit:** better options type naming ([bae4288](https://github.com/routup/routup/commit/bae4288aab78a9f600317f4a89dcf59740475c0b))
* **rate-limit:** new package for rate-limit ([7d1c2da](https://github.com/routup/routup/commit/7d1c2dab5826f8bc1d251bef323e5bd93ebf3a77))
* replaced rollup,esbuild & ts-jest with swc ([eec4671](https://github.com/routup/routup/commit/eec46710781894532b9be0b0b9d1b911f0c7e937))
* **routup:** add experimental decroator support ([6c00303](https://github.com/routup/routup/commit/6c00303c25dd06248057d9b98bee7b3e855c1c94))
* **routup:** add request hostname helper fn ([556a79a](https://github.com/routup/routup/commit/556a79a8b6c318565a2e9ffd1b3906faa15b3edb))
* **routup:** add request ip helper fn ([70cdf12](https://github.com/routup/routup/commit/70cdf120fb6db7efb688f716dedb41e5553bbcd8))
* **routup:** add request protocol helper fn ([4516174](https://github.com/routup/routup/commit/451617480ec3991412b76b1e0bb481627c231f61))
* **routup:** add support for head & options requests ([9dd0010](https://github.com/routup/routup/commit/9dd001049f2b2861aa1c6764dcaca560db243d50))
* **routup:** better naming & splitting for request header helpers ([2883c68](https://github.com/routup/routup/commit/2883c681e9828897ec4426fcad2e47827a0b90d5))
* **routup:** enhanced config container + add validations ([8d9cb7f](https://github.com/routup/routup/commit/8d9cb7fe9769d04bd779eb42d6b1bc5facbeeb0d))
* **routup:** global config container to manage options ([208be22](https://github.com/routup/routup/commit/208be2279d1cb6b6877417e133a2b20bc8314793))
* **routup:** use set-immediate to increase concurrent connections ([c240659](https://github.com/routup/routup/commit/c24065952c8c9bf4c804e5c87924166064a9f9ed))
* serve swagger ui template on paths with no trail slash ([da780dd](https://github.com/routup/routup/commit/da780dd4b424a2a11311fa04dfe1d3e4cdb8abc8))
* **static:** ignore-pattern option to prevent serving specific files ([2d4ed0c](https://github.com/routup/routup/commit/2d4ed0ca6cdd82671e0d26a6ca33b2fb9ffaa9de))
* **static:** optimized file scanning ([dd55bbd](https://github.com/routup/routup/commit/dd55bbdee65d793c8cb71bfaed6e6b0f9b6263bd))
* **swagger:** avoid import of swagger-ui-dist ([f0066fe](https://github.com/routup/routup/commit/f0066fe03e00405fb7a1c6039ad572e9c8d4621a))
* **swagger:** initialise project + ui submodule ([48c4944](https://github.com/routup/routup/commit/48c4944241a42a49f0ff2e530b5f875e09470ed9))
* **swagger:** remove resolve-package-path dependency ([d3df1b7](https://github.com/routup/routup/commit/d3df1b77b3d7edd367bdaf7c1efedff02fb782ab))
* use rollup + swc for transpiling and bundle code for esm/cjs ([aeabf06](https://github.com/routup/routup/commit/aeabf06d2372f315bdbe33546ea5dacb74ce6d9d))


### BREAKING CHANGES

* Public API changed
