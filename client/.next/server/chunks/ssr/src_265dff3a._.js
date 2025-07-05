module.exports = {

"[project]/src/redux/reduxTypes.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Category": (()=>Category)
});
var Category = /*#__PURE__*/ function(Category) {
    Category["All"] = "All Restaurants";
    Category["FastFood"] = "Fast Food";
    Category["FineDining"] = "Fine Dining";
    Category["Healthy"] = "Healthy";
    Category["Desserts"] = "Desserts";
    return Category;
}({});
}}),
"[project]/src/app/(main)/restaurants/category/[category]/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Home)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/redux/reduxTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const links = {
    [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Category"].All]: "all-restaurants",
    [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Category"].FastFood]: "fast-food",
    [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Category"].Desserts]: "desserts",
    [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Category"].FineDining]: "finedining",
    [__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$redux$2f$reduxTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Category"].Healthy]: "healthy"
};
function Home() {
    const { category } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const [isActiveFilterMenu, setIsActiveFilterMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const entry = Object.entries(links).find(([key, val])=>val === value);
    return entry ? entry[0] : undefined;
    "TURBOPACK unreachable";
}
}}),

};

//# sourceMappingURL=src_265dff3a._.js.map