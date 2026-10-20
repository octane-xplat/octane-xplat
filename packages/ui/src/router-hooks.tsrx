// Distinct shared basename prevents moduleSuffixes from re-exporting this leaf.
export {
	RouterProvider,
	RouterRenderScopeProvider,
	useRouter,
	useRouterState,
	useNavigation,
	useNavigationBlocker,
	useCanGoBack,
	useRouteMatch,
	getRouteApi,
} from './router-hooks.shared.tsrx'
