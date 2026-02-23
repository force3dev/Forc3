"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/strava/auth/route";
exports.ids = ["app/api/strava/auth/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstrava%2Fauth%2Froute&page=%2Fapi%2Fstrava%2Fauth%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstrava%2Fauth%2Froute.ts&appDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstrava%2Fauth%2Froute&page=%2Fapi%2Fstrava%2Fauth%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstrava%2Fauth%2Froute.ts&appDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_Geric_Desktop_forc3_src_app_api_strava_auth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/strava/auth/route.ts */ \"(rsc)/./src/app/api/strava/auth/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/strava/auth/route\",\n        pathname: \"/api/strava/auth\",\n        filename: \"route\",\n        bundlePath: \"app/api/strava/auth/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\Geric\\\\Desktop\\\\forc3\\\\src\\\\app\\\\api\\\\strava\\\\auth\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_Geric_Desktop_forc3_src_app_api_strava_auth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/strava/auth/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZzdHJhdmElMkZhdXRoJTJGcm91dGUmcGFnZT0lMkZhcGklMkZzdHJhdmElMkZhdXRoJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGc3RyYXZhJTJGYXV0aCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNHZXJpYyU1Q0Rlc2t0b3AlNUNmb3JjMyU1Q3NyYyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDR2VyaWMlNUNEZXNrdG9wJTVDZm9yYzMmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ3VCO0FBQ3BHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZm9yYzMvPzM3MmUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcR2VyaWNcXFxcRGVza3RvcFxcXFxmb3JjM1xcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxzdHJhdmFcXFxcYXV0aFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvc3RyYXZhL2F1dGgvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9zdHJhdmEvYXV0aFwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvc3RyYXZhL2F1dGgvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxHZXJpY1xcXFxEZXNrdG9wXFxcXGZvcmMzXFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXHN0cmF2YVxcXFxhdXRoXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9zdHJhdmEvYXV0aC9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstrava%2Fauth%2Froute&page=%2Fapi%2Fstrava%2Fauth%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstrava%2Fauth%2Froute.ts&appDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/strava/auth/route.ts":
/*!******************************************!*\
  !*** ./src/app/api/strava/auth/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\nasync function GET() {\n    const clientId = process.env.STRAVA_CLIENT_ID;\n    const redirectUri = process.env.STRAVA_REDIRECT_URI;\n    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read_all`;\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(url);\n}\nasync function DELETE() {\n    // Disconnect Strava — clear tokens from user record\n    const { getCurrentUserId } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/next\"), __webpack_require__.e(\"vendor-chunks/jose\"), __webpack_require__.e(\"_rsc_src_lib_session_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/lib/session */ \"(rsc)/./src/lib/session.ts\"));\n    const { prisma } = await __webpack_require__.e(/*! import() */ \"_rsc_src_lib_prisma_ts\").then(__webpack_require__.bind(__webpack_require__, /*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\"));\n    const userId = await getCurrentUserId();\n    if (!userId) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: \"Unauthorized\"\n    }, {\n        status: 401\n    });\n    await prisma.user.update({\n        where: {\n            id: userId\n        },\n        data: {\n            stravaConnected: false,\n            stravaAccessToken: null,\n            stravaRefreshToken: null,\n            stravaAthleteId: null\n        }\n    });\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        success: true\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9zdHJhdmEvYXV0aC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBMkM7QUFFcEMsZUFBZUM7SUFDcEIsTUFBTUMsV0FBV0MsUUFBUUMsR0FBRyxDQUFDQyxnQkFBZ0I7SUFDN0MsTUFBTUMsY0FBY0gsUUFBUUMsR0FBRyxDQUFDRyxtQkFBbUI7SUFDbkQsTUFBTUMsTUFBTSxDQUFDLGlEQUFpRCxFQUFFTixTQUFTLGNBQWMsRUFBRUksWUFBWSwyQ0FBMkMsQ0FBQztJQUNqSixPQUFPTixxREFBWUEsQ0FBQ1MsUUFBUSxDQUFDRDtBQUMvQjtBQUVPLGVBQWVFO0lBQ3BCLG9EQUFvRDtJQUNwRCxNQUFNLEVBQUVDLGdCQUFnQixFQUFFLEdBQUcsTUFBTSwrUUFBdUI7SUFDMUQsTUFBTSxFQUFFQyxNQUFNLEVBQUUsR0FBRyxNQUFNLG9LQUFzQjtJQUMvQyxNQUFNQyxTQUFTLE1BQU1GO0lBQ3JCLElBQUksQ0FBQ0UsUUFBUSxPQUFPYixxREFBWUEsQ0FBQ2MsSUFBSSxDQUFDO1FBQUVDLE9BQU87SUFBZSxHQUFHO1FBQUVDLFFBQVE7SUFBSTtJQUMvRSxNQUFNSixPQUFPSyxJQUFJLENBQUNDLE1BQU0sQ0FBQztRQUN2QkMsT0FBTztZQUFFQyxJQUFJUDtRQUFPO1FBQ3BCUSxNQUFNO1lBQUVDLGlCQUFpQjtZQUFPQyxtQkFBbUI7WUFBTUMsb0JBQW9CO1lBQU1DLGlCQUFpQjtRQUFLO0lBQzNHO0lBQ0EsT0FBT3pCLHFEQUFZQSxDQUFDYyxJQUFJLENBQUM7UUFBRVksU0FBUztJQUFLO0FBQzNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZm9yYzMvLi9zcmMvYXBwL2FwaS9zdHJhdmEvYXV0aC9yb3V0ZS50cz81NGYxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKCkge1xuICBjb25zdCBjbGllbnRJZCA9IHByb2Nlc3MuZW52LlNUUkFWQV9DTElFTlRfSUQ7XG4gIGNvbnN0IHJlZGlyZWN0VXJpID0gcHJvY2Vzcy5lbnYuU1RSQVZBX1JFRElSRUNUX1VSSTtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3LnN0cmF2YS5jb20vb2F1dGgvYXV0aG9yaXplP2NsaWVudF9pZD0ke2NsaWVudElkfSZyZWRpcmVjdF91cmk9JHtyZWRpcmVjdFVyaX0mcmVzcG9uc2VfdHlwZT1jb2RlJnNjb3BlPWFjdGl2aXR5OnJlYWRfYWxsYDtcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5yZWRpcmVjdCh1cmwpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gREVMRVRFKCkge1xuICAvLyBEaXNjb25uZWN0IFN0cmF2YSDigJQgY2xlYXIgdG9rZW5zIGZyb20gdXNlciByZWNvcmRcbiAgY29uc3QgeyBnZXRDdXJyZW50VXNlcklkIH0gPSBhd2FpdCBpbXBvcnQoXCJAL2xpYi9zZXNzaW9uXCIpO1xuICBjb25zdCB7IHByaXNtYSB9ID0gYXdhaXQgaW1wb3J0KFwiQC9saWIvcHJpc21hXCIpO1xuICBjb25zdCB1c2VySWQgPSBhd2FpdCBnZXRDdXJyZW50VXNlcklkKCk7XG4gIGlmICghdXNlcklkKSByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJVbmF1dGhvcml6ZWRcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xuICBhd2FpdCBwcmlzbWEudXNlci51cGRhdGUoe1xuICAgIHdoZXJlOiB7IGlkOiB1c2VySWQgfSxcbiAgICBkYXRhOiB7IHN0cmF2YUNvbm5lY3RlZDogZmFsc2UsIHN0cmF2YUFjY2Vzc1Rva2VuOiBudWxsLCBzdHJhdmFSZWZyZXNoVG9rZW46IG51bGwsIHN0cmF2YUF0aGxldGVJZDogbnVsbCB9LFxuICB9KTtcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgc3VjY2VzczogdHJ1ZSB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJHRVQiLCJjbGllbnRJZCIsInByb2Nlc3MiLCJlbnYiLCJTVFJBVkFfQ0xJRU5UX0lEIiwicmVkaXJlY3RVcmkiLCJTVFJBVkFfUkVESVJFQ1RfVVJJIiwidXJsIiwicmVkaXJlY3QiLCJERUxFVEUiLCJnZXRDdXJyZW50VXNlcklkIiwicHJpc21hIiwidXNlcklkIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwidXNlciIsInVwZGF0ZSIsIndoZXJlIiwiaWQiLCJkYXRhIiwic3RyYXZhQ29ubmVjdGVkIiwic3RyYXZhQWNjZXNzVG9rZW4iLCJzdHJhdmFSZWZyZXNoVG9rZW4iLCJzdHJhdmFBdGhsZXRlSWQiLCJzdWNjZXNzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/strava/auth/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstrava%2Fauth%2Froute&page=%2Fapi%2Fstrava%2Fauth%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstrava%2Fauth%2Froute.ts&appDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CGeric%5CDesktop%5Cforc3&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();