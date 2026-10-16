import type { interop } from './objc-runtime'

export declare const Y: number

export declare const SMAP_LEFT: number

export declare const SMAP_BOTTOM: number

export declare const SMAP_FRONT: number

export declare const glutBitmapHelvetica12: interop.Pointer

export declare const glutBitmap8By13: interop.Pointer

export declare const glutStrokeMonoRoman: interop.Pointer

export declare const glutStrokeRoman: interop.Pointer

export declare const _gle_gc: interop.Pointer

export declare const glutBitmapHelvetica10: interop.Pointer

export declare const SMAP_TOP: number

export declare const glutBitmapTimesRoman24: interop.Pointer

export declare const glutBitmapHelvetica18: interop.Pointer

export declare const glutBitmapTimesRoman10: interop.Pointer

export declare const Z: number

export declare const X: number

export declare const SMAP_RIGHT: number

export declare const SMAP_BACK: number

export declare const glutBitmap9By15: interop.Pointer

export declare const SphereMapFlags: {
	CLEAR_SMAP_TEXTURE: 1
	GENERATE_VIEW_MIPMAPS: 2
	GENERATE_SMAP_MIPMAPS: 4
	GENERATE_MIPMAPS: 6
}

export declare class BitmapCharRec {
	constructor(init?: BitmapCharRec)
	width: number
	height: number
	xorig: number
	yorig: number
	advance: number
	bitmap: interop.Pointer
}

export declare class StrokeFontRec {
	constructor(init?: StrokeFontRec)
	name: string | null
	num_chars: number
	ch: interop.Pointer
	top: number
	bottom: number
}

export declare class StrokeRec {
	constructor(init?: StrokeRec)
	num_coords: number
	coord: interop.Pointer
}

export declare class _SphereMapMesh {
	constructor(init?: _SphereMapMesh)
	refcnt: number
	steps: number
	rings: number
	edgeExtend: number
	face: interop.Pointer
	back: interop.Pointer
}

export declare class gleGC {
	constructor(init?: gleGC)
	bgn_gen_texture: (p1: number, p2: number) => void | null
	n3f_gen_texture: (p1: interop.PointerConvertible) => void | null
	n3d_gen_texture: (p1: interop.PointerConvertible) => void | null
	v3f_gen_texture: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null
	v3d_gen_texture: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null
	end_gen_texture: () => void | null
	join_style: number
	ncp: number
	contour: interop.Pointer
	cont_normal: interop.Pointer
	up: interop.Pointer
	npoints: number
	point_array: interop.Pointer
	color_array: interop.Pointer
	xform_array: interop.Pointer
	num_vert: number
	segment_number: number
	segment_length: number
	accum_seg_len: number
	prev_x: number
	prev_y: number
	save_bgn_gen_texture: (p1: number, p2: number) => void | null
	save_n3f_gen_texture: (p1: interop.PointerConvertible) => void | null
	save_n3d_gen_texture: (p1: interop.PointerConvertible) => void | null
	save_v3f_gen_texture: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null
	save_v3d_gen_texture: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null
	save_end_gen_texture: () => void | null
}

export declare class StrokeCharRec {
	constructor(init?: StrokeCharRec)
	num_strokes: number
	stroke: interop.Pointer
	center: number
	right: number
}

export declare class CoordRec {
	constructor(init?: CoordRec)
	x: number
	y: number
}

export declare class BitmapFontRec {
	constructor(init?: BitmapFontRec)
	name: string | null
	num_chars: number
	first: number
	ch: interop.Pointer
}

export declare class _SphereMap {
	constructor(init?: _SphereMap)
	mesh: interop.Pointer
	smapTexObj: number
	viewTexObjs: unknown /* const array */
	viewTexObj: number
	flags: interop.Enum<typeof SphereMapFlags>
	viewTexDim: number
	smapTexDim: number
	viewOrigin: unknown /* const array */
	smapOrigin: unknown /* const array */
	eye: unknown /* const array */
	up: unknown /* const array */
	obj: unknown /* const array */
	viewNear: number
	viewFar: number
	positionLights: (p1: number, p2: interop.PointerConvertible) => void | null
	drawView: (p1: number, p2: interop.PointerConvertible) => void | null
	context: interop.Pointer
}

export declare class _STXY {
	constructor(init?: _STXY)
	s: number
	t: number
	x: number
	y: number
}

export declare function glutInit(
	argcp: interop.PointerConvertible,
	argv: interop.PointerConvertible,
): void

export declare function glutInitDisplayMode(mode: number): void

export declare function glutInitDisplayString(string: string): void

export declare function glutInitWindowPosition(x: number, y: number): void

export declare function glutInitWindowSize(width: number, height: number): void

export declare function glutMainLoop(): void

export declare function glutCreateWindow(title: string): number

export declare function glutCreateSubWindow(
	win: number,
	x: number,
	y: number,
	width: number,
	height: number,
): number

export declare function glutDestroyWindow(win: number): void

export declare function glutPostRedisplay(): void

export declare function glutPostWindowRedisplay(win: number): void

export declare function glutSwapBuffers(): void

export declare function glutGetWindow(): number

export declare function glutSetWindow(win: number): void

export declare function glutSetWindowTitle(title: string): void

export declare function glutSetIconTitle(title: string): void

export declare function glutPositionWindow(x: number, y: number): void

export declare function glutReshapeWindow(width: number, height: number): void

export declare function glutPopWindow(): void

export declare function glutPushWindow(): void

export declare function glutIconifyWindow(): void

export declare function glutShowWindow(): void

export declare function glutHideWindow(): void

export declare function glutFullScreen(): void

export declare function glutSetCursor(cursor: number): void

export declare function glutWarpPointer(x: number, y: number): void

export declare function glutSurfaceTexture(
	target: number,
	internalformat: number,
	surfacewin: number,
): void

export declare function glutWMCloseFunc(func: () => void): void

export declare function glutCheckLoop(): void

export declare function glutEstablishOverlay(): void

export declare function glutRemoveOverlay(): void

export declare function glutUseLayer(layer: number): void

export declare function glutPostOverlayRedisplay(): void

export declare function glutPostWindowOverlayRedisplay(win: number): void

export declare function glutShowOverlay(): void

export declare function glutHideOverlay(): void

export declare function glutCreateMenu(p1: (p1: number) => void): number

export declare function glutDestroyMenu(menu: number): void

export declare function glutGetMenu(): number

export declare function glutSetMenu(menu: number): void

export declare function glutAddMenuEntry(label: string, value: number): void

export declare function glutAddSubMenu(label: string, submenu: number): void

export declare function glutChangeToMenuEntry(item: number, label: string, value: number): void

export declare function glutChangeToSubMenu(item: number, label: string, submenu: number): void

export declare function glutRemoveMenuItem(item: number): void

export declare function glutAttachMenu(button: number): void

export declare function glutDetachMenu(button: number): void

export declare function glutDisplayFunc(func: () => void): void

export declare function glutReshapeFunc(func: (p1: number, p2: number) => void): void

export declare function glutKeyboardFunc(func: (p1: number, p2: number, p3: number) => void): void

export declare function glutMouseFunc(
	func: (p1: number, p2: number, p3: number, p4: number) => void,
): void

export declare function glutMotionFunc(func: (p1: number, p2: number) => void): void

export declare function glutPassiveMotionFunc(func: (p1: number, p2: number) => void): void

export declare function glutEntryFunc(func: (p1: number) => void): void

export declare function glutVisibilityFunc(func: (p1: number) => void): void

export declare function glutIdleFunc(func: () => void): void

export declare function glutTimerFunc(
	millis: number,
	func: (p1: number) => void,
	value: number,
): void

export declare function glutMenuStateFunc(func: (p1: number) => void): void

export declare function glutSpecialFunc(func: (p1: number, p2: number, p3: number) => void): void

export declare function glutSpaceballMotionFunc(
	func: (p1: number, p2: number, p3: number) => void,
): void

export declare function glutSpaceballRotateFunc(
	func: (p1: number, p2: number, p3: number) => void,
): void

export declare function glutSpaceballButtonFunc(func: (p1: number, p2: number) => void): void

export declare function glutButtonBoxFunc(func: (p1: number, p2: number) => void): void

export declare function glutDialsFunc(func: (p1: number, p2: number) => void): void

export declare function glutTabletMotionFunc(func: (p1: number, p2: number) => void): void

export declare function glutTabletButtonFunc(
	func: (p1: number, p2: number, p3: number, p4: number) => void,
): void

export declare function glutMenuStatusFunc(func: (p1: number, p2: number, p3: number) => void): void

export declare function glutOverlayDisplayFunc(func: () => void): void

export declare function glutWindowStatusFunc(func: (p1: number) => void): void

export declare function glutKeyboardUpFunc(func: (p1: number, p2: number, p3: number) => void): void

export declare function glutSpecialUpFunc(func: (p1: number, p2: number, p3: number) => void): void

export declare function glutJoystickFunc(
	func: (p1: number, p2: number, p3: number, p4: number) => void,
	pollInterval: number,
): void

export declare function glutSetColor(p1: number, red: number, green: number, blue: number): void

export declare function glutGetColor(ndx: number, component: number): number

export declare function glutCopyColormap(win: number): void

export declare function glutGet(type: number): number

export declare function glutDeviceGet(type: number): number

export declare function glutExtensionSupported(name: string): number

export declare function glutGetModifiers(): number

export declare function glutLayerGet(type: number): number

export declare function glutGetProcAddress(procName: string): interop.Pointer

export declare function glutBitmapCharacter(
	font: interop.PointerConvertible,
	character: number,
): void

export declare function glutBitmapWidth(font: interop.PointerConvertible, character: number): number

export declare function glutStrokeCharacter(
	font: interop.PointerConvertible,
	character: number,
): void

export declare function glutStrokeWidth(font: interop.PointerConvertible, character: number): number

export declare function glutBitmapLength(
	font: interop.PointerConvertible,
	string: interop.PointerConvertible,
): number

export declare function glutStrokeLength(
	font: interop.PointerConvertible,
	string: interop.PointerConvertible,
): number

export declare function glutWireSphere(radius: number, slices: number, stacks: number): void

export declare function glutSolidSphere(radius: number, slices: number, stacks: number): void

export declare function glutWireCone(
	base: number,
	height: number,
	slices: number,
	stacks: number,
): void

export declare function glutSolidCone(
	base: number,
	height: number,
	slices: number,
	stacks: number,
): void

export declare function glutWireCube(size: number): void

export declare function glutSolidCube(size: number): void

export declare function glutWireTorus(
	innerRadius: number,
	outerRadius: number,
	sides: number,
	rings: number,
): void

export declare function glutSolidTorus(
	innerRadius: number,
	outerRadius: number,
	sides: number,
	rings: number,
): void

export declare function glutWireDodecahedron(): void

export declare function glutSolidDodecahedron(): void

export declare function glutWireTeapot(size: number): void

export declare function glutSolidTeapot(size: number): void

export declare function glutWireOctahedron(): void

export declare function glutSolidOctahedron(): void

export declare function glutWireTetrahedron(): void

export declare function glutSolidTetrahedron(): void

export declare function glutWireIcosahedron(): void

export declare function glutSolidIcosahedron(): void

export declare function glutVideoResizeGet(param: number): number

export declare function glutSetupVideoResizing(): void

export declare function glutStopVideoResizing(): void

export declare function glutVideoResize(x: number, y: number, width: number, height: number): void

export declare function glutVideoPan(x: number, y: number, width: number, height: number): void

export declare function glutReportErrors(): void

export declare function glutIgnoreKeyRepeat(ignore: number): void

export declare function glutSetKeyRepeat(repeatMode: number): void

export declare function glutForceJoystickFunc(): void

export declare function glutGameModeString(string: string): void

export declare function glutEnterGameMode(): number

export declare function glutLeaveGameMode(): void

export declare function glutGameModeGet(mode: number): number

export declare function up_sanity_check(
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
): void

export declare function draw_raw_style_end_cap(
	ncp: number,
	contour: interop.Pointer,
	zval: number,
	frontwards: number,
): void

export declare function draw_round_style_cap_callback(
	iloop: number,
	cap: interop.Pointer,
	face_color: unknown /* const array */,
	cut_vector: unknown /* const array */,
	bisect_vector: unknown /* const array */,
	norms: interop.Pointer,
	frontwards: number,
): void

export declare function draw_angle_style_front_cap(
	ncp: number,
	bi: unknown /* const array */,
	point_array: interop.Pointer,
): void

export declare function extrusion_raw_join(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	xform_array: interop.Pointer,
): void

export declare function extrusion_round_or_cut_join(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	xform_array: interop.Pointer,
): void

export declare function extrusion_angle_join(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	xform_array: interop.Pointer,
): void

export declare function rot_axis_f(omega: number, axis: unknown /* const array */): void

export declare function rot_about_axis_f(angle: number, axis: unknown /* const array */): void

export declare function rot_omega_f(axis: unknown /* const array */): void

export declare function urot_axis_f(
	m: unknown /* const array */,
	omega: number,
	axis: unknown /* const array */,
): void

export declare function urot_about_axis_f(
	m: unknown /* const array */,
	angle: number,
	axis: unknown /* const array */,
): void

export declare function urot_omega_f(
	m: unknown /* const array */,
	axis: unknown /* const array */,
): void

export declare function rot_axis_d(omega: number, axis: unknown /* const array */): void

export declare function rot_about_axis_d(angle: number, axis: unknown /* const array */): void

export declare function rot_omega_d(axis: unknown /* const array */): void

export declare function urot_axis_d(
	m: unknown /* const array */,
	omega: number,
	axis: unknown /* const array */,
): void

export declare function urot_about_axis_d(
	m: unknown /* const array */,
	angle: number,
	axis: unknown /* const array */,
): void

export declare function urot_omega_d(
	m: unknown /* const array */,
	axis: unknown /* const array */,
): void

export declare function uview_direction_d(
	m: unknown /* const array */,
	v21: unknown /* const array */,
	up: unknown /* const array */,
): void

export declare function uview_direction_f(
	m: unknown /* const array */,
	v21: unknown /* const array */,
	up: unknown /* const array */,
): void

export declare function uviewpoint_d(
	m: unknown /* const array */,
	v1: unknown /* const array */,
	v2: unknown /* const array */,
	up: unknown /* const array */,
): void

export declare function uviewpoint_f(
	m: unknown /* const array */,
	v1: unknown /* const array */,
	v2: unknown /* const array */,
	up: unknown /* const array */,
): void

export declare function smapCreateSphereMap(shareSmap: interop.PointerConvertible): interop.Pointer

export declare function smapDestroySphereMap(smap: interop.PointerConvertible): void

export declare function smapConfigureSphereMapMesh(
	smap: interop.PointerConvertible,
	steps: number,
	rings: number,
	edgeExtend: number,
): void

export declare function smapSetSphereMapTexObj(
	smap: interop.PointerConvertible,
	texobj: number,
): void

export declare function smapSetViewTexObj(smap: interop.PointerConvertible, texobj: number): void

export declare function smapSetViewTexObjs(
	smap: interop.PointerConvertible,
	texobjs: unknown /* const array */,
): void

export declare function smapGetSphereMapTexObj(
	smap: interop.PointerConvertible,
	texobj: interop.PointerConvertible,
): void

export declare function smapGetViewTexObj(
	smap: interop.PointerConvertible,
	texobj: interop.PointerConvertible,
): void

export declare function smapGetViewTexObjs(
	smap: interop.PointerConvertible,
	texobjs: unknown /* const array */,
): void

export declare function smapSetFlags(
	smap: interop.PointerConvertible,
	flags: interop.Enum<typeof SphereMapFlags>,
): void

export declare function smapGetFlags(
	smap: interop.PointerConvertible,
	flags: interop.PointerConvertible,
): void

export declare function smapSetViewOrigin(
	smap: interop.PointerConvertible,
	x: number,
	y: number,
): void

export declare function smapSetSphereMapOrigin(
	smap: interop.PointerConvertible,
	x: number,
	y: number,
): void

export declare function smapGetViewOrigin(
	smap: interop.PointerConvertible,
	x: interop.PointerConvertible,
	y: interop.PointerConvertible,
): void

export declare function smapGetSphereMapOrigin(
	smap: interop.PointerConvertible,
	x: interop.PointerConvertible,
	y: interop.PointerConvertible,
): void

export declare function smapSetEye(
	smap: interop.PointerConvertible,
	eyex: number,
	eyey: number,
	eyez: number,
): void

export declare function smapSetEyeVector(
	smap: interop.PointerConvertible,
	eye: interop.PointerConvertible,
): void

export declare function smapSetUp(
	smap: interop.PointerConvertible,
	upx: number,
	upy: number,
	upz: number,
): void

export declare function smapSetUpVector(
	smap: interop.PointerConvertible,
	up: interop.PointerConvertible,
): void

export declare function smapSetObject(
	smap: interop.PointerConvertible,
	objx: number,
	objy: number,
	objz: number,
): void

export declare function smapSetObjectVector(
	smap: interop.PointerConvertible,
	obj: interop.PointerConvertible,
): void

export declare function smapGetEye(
	smap: interop.PointerConvertible,
	eyex: interop.PointerConvertible,
	eyey: interop.PointerConvertible,
	eyez: interop.PointerConvertible,
): void

export declare function smapGetEyeVector(
	smap: interop.PointerConvertible,
	eye: interop.PointerConvertible,
): void

export declare function smapGetUp(
	smap: interop.PointerConvertible,
	upx: interop.PointerConvertible,
	upy: interop.PointerConvertible,
	upz: interop.PointerConvertible,
): void

export declare function smapGetUpVector(
	smap: interop.PointerConvertible,
	up: interop.PointerConvertible,
): void

export declare function smapGetObject(
	smap: interop.PointerConvertible,
	objx: interop.PointerConvertible,
	objy: interop.PointerConvertible,
	objz: interop.PointerConvertible,
): void

export declare function smapGetObjectVector(
	smap: interop.PointerConvertible,
	obj: interop.PointerConvertible,
): void

export declare function smapSetNearFar(
	smap: interop.PointerConvertible,
	viewNear: number,
	viewFar: number,
): void

export declare function smapGetNearFar(
	smap: interop.PointerConvertible,
	viewNear: interop.PointerConvertible,
	viewFar: interop.PointerConvertible,
): void

export declare function smapSetSphereMapTexDim(
	smap: interop.PointerConvertible,
	texdim: number,
): void

export declare function smapSetViewTexDim(smap: interop.PointerConvertible, texdim: number): void

export declare function smapGetSphereMapTexDim(
	smap: interop.PointerConvertible,
	texdim: interop.PointerConvertible,
): void

export declare function smapGetViewTexDim(
	smap: interop.PointerConvertible,
	texdim: interop.PointerConvertible,
): void

export declare function smapSetContextData(
	smap: interop.PointerConvertible,
	context: interop.PointerConvertible,
): void

export declare function smapGetContextData(
	smap: interop.PointerConvertible,
	context: interop.PointerConvertible,
): void

export declare function smapSetPositionLightsFunc(
	smap: interop.PointerConvertible,
	positionLights: (p1: number, p2: interop.PointerConvertible) => void,
): void

export declare function smapSetDrawViewFunc(
	smap: interop.PointerConvertible,
	drawView: (p1: number, p2: interop.PointerConvertible) => void,
): void

export declare function smapGetPositionLightsFunc(
	smap: interop.PointerConvertible,
	positionLights: interop.PointerConvertible,
): void

export declare function smapGetDrawViewFunc(
	smap: interop.PointerConvertible,
	drawView: interop.PointerConvertible,
): void

export declare function smapGenViewTex(smap: interop.PointerConvertible, view: number): void

export declare function smapGenViewTexs(smap: interop.PointerConvertible): void

export declare function smapGenSphereMapFromViewTexs(smap: interop.PointerConvertible): void

export declare function smapGenSphereMap(smap: interop.PointerConvertible): void

export declare function smapGenSphereMapWithOneViewTex(smap: interop.PointerConvertible): void

export declare function smapRvecToSt(
	rvec: unknown /* const array */,
	st: unknown /* const array */,
): number

export declare function smapStToRvec(
	st: interop.PointerConvertible,
	rvec: interop.PointerConvertible,
): void

export declare function gleGetJoinStyle(): number

export declare function gleSetJoinStyle(style: number): void

export declare function gleGetNumSlices(): number

export declare function gleSetNumSlices(slices: number): void

export declare function glePolyCylinder(
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	radius: number,
): void

export declare function glePolyCone(
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	radius_array: interop.Pointer,
): void

export declare function gleExtrusion(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
): void

export declare function gleTwistExtrusion(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	twist_array: interop.Pointer,
): void

export declare function gleSuperExtrusion(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	npoints: number,
	point_array: interop.Pointer,
	color_array: interop.Pointer,
	xform_array: interop.Pointer,
): void

export declare function gleSpiral(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	startRadius: number,
	drdTheta: number,
	startZ: number,
	dzdTheta: number,
	startXform: unknown /* const array */,
	dXformdTheta: unknown /* const array */,
	startTheta: number,
	sweepTheta: number,
): void

export declare function gleLathe(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	startRadius: number,
	drdTheta: number,
	startZ: number,
	dzdTheta: number,
	startXform: unknown /* const array */,
	dXformdTheta: unknown /* const array */,
	startTheta: number,
	sweepTheta: number,
): void

export declare function gleHelicoid(
	rToroid: number,
	startRadius: number,
	drdTheta: number,
	startZ: number,
	dzdTheta: number,
	startXform: unknown /* const array */,
	dXformdTheta: unknown /* const array */,
	startTheta: number,
	sweepTheta: number,
): void

export declare function gleToroid(
	rToroid: number,
	startRadius: number,
	drdTheta: number,
	startZ: number,
	dzdTheta: number,
	startXform: unknown /* const array */,
	dXformdTheta: unknown /* const array */,
	startTheta: number,
	sweepTheta: number,
): void

export declare function gleScrew(
	ncp: number,
	contour: interop.Pointer,
	cont_normal: interop.Pointer,
	up: unknown /* const array */,
	startz: number,
	endz: number,
	twist: number,
): void

export declare function gleTextureMode(mode: number): void

export declare function draw_segment_plain(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	inext: number,
	len: number,
): void

export declare function draw_segment_color(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	color_last: unknown /* const array */,
	color_next: unknown /* const array */,
	inext: number,
	len: number,
): void

export declare function draw_segment_edge_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	norm_cont: interop.Pointer,
	inext: number,
	len: number,
): void

export declare function draw_segment_c_and_edge_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	norm_cont: interop.Pointer,
	color_last: unknown /* const array */,
	color_next: unknown /* const array */,
	inext: number,
	len: number,
): void

export declare function draw_segment_facet_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	norm_cont: interop.Pointer,
	inext: number,
	len: number,
): void

export declare function draw_segment_c_and_facet_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	norm_cont: interop.Pointer,
	color_last: unknown /* const array */,
	color_next: unknown /* const array */,
	inext: number,
	len: number,
): void

export declare function draw_binorm_segment_edge_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	front_norm: interop.Pointer,
	back_norm: interop.Pointer,
	inext: number,
	len: number,
): void

export declare function draw_binorm_segment_c_and_edge_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	front_norm: interop.Pointer,
	back_norm: interop.Pointer,
	color_last: unknown /* const array */,
	color_next: unknown /* const array */,
	inext: number,
	len: number,
): void

export declare function draw_binorm_segment_facet_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	front_norm: interop.Pointer,
	back_norm: interop.Pointer,
	inext: number,
	len: number,
): void

export declare function draw_binorm_segment_c_and_facet_n(
	ncp: number,
	front_contour: interop.Pointer,
	back_contour: interop.Pointer,
	front_norm: interop.Pointer,
	back_norm: interop.Pointer,
	color_last: unknown /* const array */,
	color_next: unknown /* const array */,
	inext: number,
	len: number,
): void

export declare function draw_angle_style_back_cap(
	ncp: number,
	bi: unknown /* const array */,
	point_array: interop.Pointer,
): void

export declare function __smapDrawSphereMapMeshSide(
	mesh: interop.PointerConvertible,
	side: number,
): void

export declare function __smapDrawSphereMapMeshBack(mesh: interop.PointerConvertible): void

export declare function __smapValidateSphereMapMesh(mesh: interop.PointerConvertible): void

export declare function gleCreateGC(): interop.Pointer

export declare function bisecting_plane(
	n: unknown /* const array */,
	v1: unknown /* const array */,
	v2: unknown /* const array */,
	v3: unknown /* const array */,
): number

export declare function __glutGetFCB(which: number): interop.Pointer

export declare function __glutSetFCB(which: number, func: interop.PointerConvertible): void
