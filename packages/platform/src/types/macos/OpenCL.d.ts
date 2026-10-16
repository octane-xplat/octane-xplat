import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'

export declare const clk_sampler_type: {
	__CLK_ADDRESS_BASE: 0
	CLK_ADDRESS_NONE: 0
	CLK_ADDRESS_CLAMP: 1
	CLK_ADDRESS_CLAMP_TO_EDGE: 2
	CLK_ADDRESS_REPEAT: 3
	CLK_ADDRESS_MIRRORED_REPEAT: 4
	__CLK_ADDRESS_MASK: 7
	__CLK_ADDRESS_BITS: 3
	__CLK_NORMALIZED_BASE: 3
	CLK_NORMALIZED_COORDS_FALSE: 0
	CLK_NORMALIZED_COORDS_TRUE: 8
	__CLK_NORMALIZED_MASK: 8
	__CLK_NORMALIZED_BITS: 1
	__CLK_FILTER_BASE: 4
	CLK_FILTER_NEAREST: 0
	CLK_FILTER_LINEAR: 16
	__CLK_FILTER_MASK: 16
	__CLK_FILTER_BITS: 2
}

export declare class _cl_dag {
	constructor(init?: _cl_dag)
}

export declare class _cl_buffer_region {
	constructor(init?: _cl_buffer_region)
	origin: number
	size: number
}

export declare class _cl_image_desc {
	constructor(init?: _cl_image_desc)
	image_type: number
	image_width: number
	image_height: number
	image_depth: number
	image_array_size: number
	image_row_pitch: number
	image_slice_pitch: number
	num_mip_levels: number
	num_samples: number
	buffer: interop.Pointer
}

export declare class _cl_sampler {
	constructor(init?: _cl_sampler)
}

export declare class _cl_event {
	constructor(init?: _cl_event)
}

export declare class _cl_command_queue {
	constructor(init?: _cl_command_queue)
}

export declare class unnamed_2483764943515482214 {
	constructor(init?: unnamed_2483764943515482214)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_15741556231124133102 {
	constructor(init?: unnamed_15741556231124133102)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_10294698351223198589 {
	constructor(init?: unnamed_10294698351223198589)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_3053895458168324215 {
	constructor(init?: unnamed_3053895458168324215)
	lo: cl_double2
	hi: cl_double2
}

export declare class unnamed_1939418696028979615 {
	constructor(init?: unnamed_1939418696028979615)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_12240903398450865643 {
	constructor(init?: unnamed_12240903398450865643)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_15449280231777481485 {
	constructor(init?: unnamed_15449280231777481485)
	lo: number
	hi: number
}

export declare class unnamed_3292716080042213183 {
	constructor(init?: unnamed_3292716080042213183)
	s0: number
	s1: number
}

export declare class unnamed_7169481142266100868 {
	constructor(init?: unnamed_7169481142266100868)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_2350748331482497043 {
	constructor(init?: unnamed_2350748331482497043)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_12876945507834836059 {
	constructor(init?: unnamed_12876945507834836059)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_9504822028459405056 {
	constructor(init?: unnamed_9504822028459405056)
	lo: cl_float2
	hi: cl_float2
}

export declare class unnamed_13974885479058445471 {
	constructor(init?: unnamed_13974885479058445471)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_5331894520101567479 {
	constructor(init?: unnamed_5331894520101567479)
	lo: number
	hi: number
}

export declare class unnamed_2311373803082415729 {
	constructor(init?: unnamed_2311373803082415729)
	x: number
	y: number
}

export declare class unnamed_5080659664542571697 {
	constructor(init?: unnamed_5080659664542571697)
	lo: cl_ulong8
	hi: cl_ulong8
}

export declare class unnamed_8441186778083726845 {
	constructor(init?: unnamed_8441186778083726845)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_16121583949887126968 {
	constructor(init?: unnamed_16121583949887126968)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_7377098233121674861 {
	constructor(init?: unnamed_7377098233121674861)
	lo: cl_ulong4
	hi: cl_ulong4
}

export declare class unnamed_5128784236535877331 {
	constructor(init?: unnamed_5128784236535877331)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_7604878644914655808 {
	constructor(init?: unnamed_7604878644914655808)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_6571821126075350526 {
	constructor(init?: unnamed_6571821126075350526)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_909259717851587097 {
	constructor(init?: unnamed_909259717851587097)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_8647237121515440081 {
	constructor(init?: unnamed_8647237121515440081)
	lo: number
	hi: number
}

export declare class unnamed_8320836447533634967 {
	constructor(init?: unnamed_8320836447533634967)
	s0: number
	s1: number
}

export declare class unnamed_5034479264849833534 {
	constructor(init?: unnamed_5034479264849833534)
	x: number
	y: number
}

export declare class unnamed_6278726011779523998 {
	constructor(init?: unnamed_6278726011779523998)
	lo: cl_long8
	hi: cl_long8
}

export declare class unnamed_3377842691103495452 {
	constructor(init?: unnamed_3377842691103495452)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_6998960638199730582 {
	constructor(init?: unnamed_6998960638199730582)
	lo: cl_long4
	hi: cl_long4
}

export declare class unnamed_1561776904853729109 {
	constructor(init?: unnamed_1561776904853729109)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_11346632509166628684 {
	constructor(init?: unnamed_11346632509166628684)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_18148138592501739084 {
	constructor(init?: unnamed_18148138592501739084)
	lo: cl_long2
	hi: cl_long2
}

export declare class unnamed_24136814615894644 {
	constructor(init?: unnamed_24136814615894644)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_8896577509604911105 {
	constructor(init?: unnamed_8896577509604911105)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_8060645300088544072 {
	constructor(init?: unnamed_8060645300088544072)
	lo: number
	hi: number
}

export declare class unnamed_18228857244780252158 {
	constructor(init?: unnamed_18228857244780252158)
	x: number
	y: number
}

export declare class unnamed_12691538164065934375 {
	constructor(init?: unnamed_12691538164065934375)
	lo: cl_uint8
	hi: cl_uint8
}

export declare class unnamed_6951674756479411762 {
	constructor(init?: unnamed_6951674756479411762)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_6547954818795156813 {
	constructor(init?: unnamed_6547954818795156813)
	lo: cl_uint4
	hi: cl_uint4
}

export declare class unnamed_11355656696164525467 {
	constructor(init?: unnamed_11355656696164525467)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_3073385698243067910 {
	constructor(init?: unnamed_3073385698243067910)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_15971256825251946722 {
	constructor(init?: unnamed_15971256825251946722)
	lo: number
	hi: number
}

export declare class unnamed_15441550147442941409 {
	constructor(init?: unnamed_15441550147442941409)
	s0: number
	s1: number
}

export declare class unnamed_10027635823284803434 {
	constructor(init?: unnamed_10027635823284803434)
	x: number
	y: number
}

export declare class unnamed_2101024455131179368 {
	constructor(init?: unnamed_2101024455131179368)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_13120177925014668505 {
	constructor(init?: unnamed_13120177925014668505)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_15306882775472602492 {
	constructor(init?: unnamed_15306882775472602492)
	lo: cl_int2
	hi: cl_int2
}

export declare class unnamed_10066427755259504985 {
	constructor(init?: unnamed_10066427755259504985)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_14038947579925880586 {
	constructor(init?: unnamed_14038947579925880586)
	lo: number
	hi: number
}

export declare class unnamed_3573542672450911177 {
	constructor(init?: unnamed_3573542672450911177)
	lo: cl_ushort8
	hi: cl_ushort8
}

export declare class unnamed_15111820707888214144 {
	constructor(init?: unnamed_15111820707888214144)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_2118303671312756284 {
	constructor(init?: unnamed_2118303671312756284)
	lo: cl_ushort2
	hi: cl_ushort2
}

export declare class unnamed_13546735127160425328 {
	constructor(init?: unnamed_13546735127160425328)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_4053999186195862062 {
	constructor(init?: unnamed_4053999186195862062)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_13075223488305889990 {
	constructor(init?: unnamed_13075223488305889990)
	s0: number
	s1: number
}

export declare class unnamed_8755497827919246721 {
	constructor(init?: unnamed_8755497827919246721)
	lo: cl_short8
	hi: cl_short8
}

export declare class unnamed_10997111517985102545 {
	constructor(init?: unnamed_10997111517985102545)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_17103214144676645958 {
	constructor(init?: unnamed_17103214144676645958)
	lo: number
	hi: number
}

export declare class unnamed_4017657950511228689 {
	constructor(init?: unnamed_4017657950511228689)
	s0: number
	s1: number
}

export declare class unnamed_16297865257217576926 {
	constructor(init?: unnamed_16297865257217576926)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_7333720846647317664 {
	constructor(init?: unnamed_7333720846647317664)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_4939182616333615334 {
	constructor(init?: unnamed_4939182616333615334)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_17275687214477448247 {
	constructor(init?: unnamed_17275687214477448247)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_2432961635487858770 {
	constructor(init?: unnamed_2432961635487858770)
	lo: cl_uchar2
	hi: cl_uchar2
}

export declare class unnamed_9847285140892466645 {
	constructor(init?: unnamed_9847285140892466645)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_18175413709729932737 {
	constructor(init?: unnamed_18175413709729932737)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_11850341348343861034 {
	constructor(init?: unnamed_11850341348343861034)
	lo: number
	hi: number
}

export declare class unnamed_10382481525009199381 {
	constructor(init?: unnamed_10382481525009199381)
	lo: cl_char8
	hi: cl_char8
}

export declare class unnamed_4217167017580382048 {
	constructor(init?: unnamed_4217167017580382048)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_7311972336041947281 {
	constructor(init?: unnamed_7311972336041947281)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_16777635811540662744 {
	constructor(init?: unnamed_16777635811540662744)
	lo: cl_char2
	hi: cl_char2
}

export declare class unnamed_6785828211728984593 {
	constructor(init?: unnamed_6785828211728984593)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_10291270106541491636 {
	constructor(init?: unnamed_10291270106541491636)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_8826955232033586965 {
	constructor(init?: unnamed_8826955232033586965)
	lo: number
	hi: number
}

export declare class unnamed_1823788124286536441 {
	constructor(init?: unnamed_1823788124286536441)
	x: number
	y: number
}

export declare class _cl_image_format {
	constructor(init?: _cl_image_format)
	image_channel_order: number
	image_channel_data_type: number
}

export declare class unnamed_14784651456623545568 {
	constructor(init?: unnamed_14784651456623545568)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_6854378006991717788 {
	constructor(init?: unnamed_6854378006991717788)
	lo: cl_float8
	hi: cl_float8
}

export declare class unnamed_2829588415768359801 {
	constructor(init?: unnamed_2829588415768359801)
	s0: number
	s1: number
}

export declare class _cl_ndrange {
	constructor(init?: _cl_ndrange)
	work_dim: number
	global_work_offset: unknown /* const array */
	global_work_size: unknown /* const array */
	local_work_size: unknown /* const array */
}

export declare class unnamed_3112450303733753810 {
	constructor(init?: unnamed_3112450303733753810)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_1456134388190171011 {
	constructor(init?: unnamed_1456134388190171011)
	x: number
	y: number
}

export declare class unnamed_2417764106441821353 {
	constructor(init?: unnamed_2417764106441821353)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_12319397561122510792 {
	constructor(init?: unnamed_12319397561122510792)
	lo: cl_double4
	hi: cl_double4
}

export declare class _cl_program {
	constructor(init?: _cl_program)
}

export declare class unnamed_7488759266411493635 {
	constructor(init?: unnamed_7488759266411493635)
	lo: cl_float4
	hi: cl_float4
}

export declare class unnamed_12138047548866814392 {
	constructor(init?: unnamed_12138047548866814392)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_559611881667317308 {
	constructor(init?: unnamed_559611881667317308)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_1869896756761038783 {
	constructor(init?: unnamed_1869896756761038783)
	lo: cl_short4
	hi: cl_short4
}

export declare class unnamed_1230197160608546477 {
	constructor(init?: unnamed_1230197160608546477)
	lo: cl_int4
	hi: cl_int4
}

export declare class unnamed_13484981168686021852 {
	constructor(init?: unnamed_13484981168686021852)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_784284328094235777 {
	constructor(init?: unnamed_784284328094235777)
	lo: cl_uint2
	hi: cl_uint2
}

export declare class unnamed_1080710889126406222 {
	constructor(init?: unnamed_1080710889126406222)
	x: number
	y: number
}

export declare class unnamed_17078030058422365862 {
	constructor(init?: unnamed_17078030058422365862)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_9868277684619457600 {
	constructor(init?: unnamed_9868277684619457600)
	s0: number
	s1: number
	s2: number
	s3: number
}

export declare class unnamed_9421984436941315905 {
	constructor(init?: unnamed_9421984436941315905)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_13003685470504738507 {
	constructor(init?: unnamed_13003685470504738507)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_14012788938750538510 {
	constructor(init?: unnamed_14012788938750538510)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_17893067815841480071 {
	constructor(init?: unnamed_17893067815841480071)
	x: number
	y: number
}

export declare class unnamed_3491873004675490415 {
	constructor(init?: unnamed_3491873004675490415)
	lo: cl_uchar4
	hi: cl_uchar4
}

export declare class unnamed_13740499781246040139 {
	constructor(init?: unnamed_13740499781246040139)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_425482760449447396 {
	constructor(init?: unnamed_425482760449447396)
	lo: cl_uchar8
	hi: cl_uchar8
}

export declare class unnamed_7363317408277652423 {
	constructor(init?: unnamed_7363317408277652423)
	lo: cl_ulong2
	hi: cl_ulong2
}

export declare class unnamed_602869869429064763 {
	constructor(init?: unnamed_602869869429064763)
	lo: cl_int8
	hi: cl_int8
}

export declare class unnamed_63267319100147132 {
	constructor(init?: unnamed_63267319100147132)
	x: number
	y: number
}

export declare class unnamed_8944820102214453461 {
	constructor(init?: unnamed_8944820102214453461)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class unnamed_5546594151218150266 {
	constructor(init?: unnamed_5546594151218150266)
	x: number
	y: number
	z: number
	w: number
	__spacer4: number
	__spacer5: number
	__spacer6: number
	__spacer7: number
	__spacer8: number
	__spacer9: number
	sa: number
	sb: number
	sc: number
	sd: number
	se: number
	sf: number
}

export declare class unnamed_2720638507259637259 {
	constructor(init?: unnamed_2720638507259637259)
	s0: number
	s1: number
}

export declare class unnamed_6267316624760596680 {
	constructor(init?: unnamed_6267316624760596680)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_18364187210752631503 {
	constructor(init?: unnamed_18364187210752631503)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
}

export declare class _cl_kernel {
	constructor(init?: _cl_kernel)
}

export declare class unnamed_4114971849776712631 {
	constructor(init?: unnamed_4114971849776712631)
	x: number
	y: number
}

export declare class unnamed_13724207982637835415 {
	constructor(init?: unnamed_13724207982637835415)
	x: number
	y: number
	z: number
	w: number
}

export declare class _cl_platform_id {
	constructor(init?: _cl_platform_id)
}

export declare class unnamed_11365654201243819123 {
	constructor(init?: unnamed_11365654201243819123)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class unnamed_18304119203593759976 {
	constructor(init?: unnamed_18304119203593759976)
	lo: cl_double8
	hi: cl_double8
}

export declare class unnamed_11686549214669458157 {
	constructor(init?: unnamed_11686549214669458157)
	s0: number
	s1: number
}

export declare class unnamed_5350363337577217929 {
	constructor(init?: unnamed_5350363337577217929)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_2890443392315689372 {
	constructor(init?: unnamed_2890443392315689372)
	s0: number
	s1: number
}

export declare class unnamed_14230173837754717038 {
	constructor(init?: unnamed_14230173837754717038)
	lo: cl_ushort4
	hi: cl_ushort4
}

export declare class unnamed_2726157697962003908 {
	constructor(init?: unnamed_2726157697962003908)
	lo: cl_short2
	hi: cl_short2
}

export declare class unnamed_7127281727625771774 {
	constructor(init?: unnamed_7127281727625771774)
	lo: number
	hi: number
}

export declare class unnamed_4394704991241361804 {
	constructor(init?: unnamed_4394704991241361804)
	s0: number
	s1: number
	s2: number
	s3: number
	s4: number
	s5: number
	s6: number
	s7: number
	s8: number
	s9: number
	sA: number
	sB: number
	sC: number
	sD: number
	sE: number
	sF: number
}

export declare class _cl_context {
	constructor(init?: _cl_context)
}

export declare class unnamed_9892329185140234373 {
	constructor(init?: unnamed_9892329185140234373)
	lo: cl_char4
	hi: cl_char4
}

export declare class unnamed_3400272089348881895 {
	constructor(init?: unnamed_3400272089348881895)
	s0: number
	s1: number
}

export declare class _cl_mem {
	constructor(init?: _cl_mem)
}

export type cl_double4Descriptor = { s: unknown /* const array */ }

export declare class cl_double4 {
	constructor(init?: cl_double4Descriptor)
	s: unknown /* const array */
}

export type cl_ulong8Descriptor = { s: unknown /* const array */ }

export declare class cl_ulong8 {
	constructor(init?: cl_ulong8Descriptor)
	s: unknown /* const array */
}

export type cl_char8Descriptor = { s: unknown /* const array */ }

export declare class cl_char8 {
	constructor(init?: cl_char8Descriptor)
	s: unknown /* const array */
}

export type cl_double16Descriptor = { s: unknown /* const array */ }

export declare class cl_double16 {
	constructor(init?: cl_double16Descriptor)
	s: unknown /* const array */
}

export type cl_double8Descriptor = { s: unknown /* const array */ }

export declare class cl_double8 {
	constructor(init?: cl_double8Descriptor)
	s: unknown /* const array */
}

export type cl_float16Descriptor = { s: unknown /* const array */ }

export declare class cl_float16 {
	constructor(init?: cl_float16Descriptor)
	s: unknown /* const array */
}

export type cl_float4Descriptor = { s: unknown /* const array */ }

export declare class cl_float4 {
	constructor(init?: cl_float4Descriptor)
	s: unknown /* const array */
}

export type cl_long16Descriptor = { s: unknown /* const array */ }

export declare class cl_long16 {
	constructor(init?: cl_long16Descriptor)
	s: unknown /* const array */
}

export type cl_long4Descriptor = { s: unknown /* const array */ }

export declare class cl_long4 {
	constructor(init?: cl_long4Descriptor)
	s: unknown /* const array */
}

export type cl_long2Descriptor = { s: unknown /* const array */ }

export declare class cl_long2 {
	constructor(init?: cl_long2Descriptor)
	s: unknown /* const array */
}

export type cl_uint4Descriptor = { s: unknown /* const array */ }

export declare class cl_uint4 {
	constructor(init?: cl_uint4Descriptor)
	s: unknown /* const array */
}

export type cl_uint2Descriptor = { s: unknown /* const array */ }

export declare class cl_uint2 {
	constructor(init?: cl_uint2Descriptor)
	s: unknown /* const array */
}

export type cl_int4Descriptor = { s: unknown /* const array */ }

export declare class cl_int4 {
	constructor(init?: cl_int4Descriptor)
	s: unknown /* const array */
}

export type cl_ushort2Descriptor = { s: unknown /* const array */ }

export declare class cl_ushort2 {
	constructor(init?: cl_ushort2Descriptor)
	s: unknown /* const array */
}

export type cl_short16Descriptor = { s: unknown /* const array */ }

export declare class cl_short16 {
	constructor(init?: cl_short16Descriptor)
	s: unknown /* const array */
}

export type cl_short4Descriptor = { s: unknown /* const array */ }

export declare class cl_short4 {
	constructor(init?: cl_short4Descriptor)
	s: unknown /* const array */
}

export type cl_uchar4Descriptor = { s: unknown /* const array */ }

export declare class cl_uchar4 {
	constructor(init?: cl_uchar4Descriptor)
	s: unknown /* const array */
}

export type cl_char4Descriptor = { s: unknown /* const array */ }

export declare class cl_char4 {
	constructor(init?: cl_char4Descriptor)
	s: unknown /* const array */
}

export type cl_char2Descriptor = { s: unknown /* const array */ }

export declare class cl_char2 {
	constructor(init?: cl_char2Descriptor)
	s: unknown /* const array */
}

export type cl_int8Descriptor = { s: unknown /* const array */ }

export declare class cl_int8 {
	constructor(init?: cl_int8Descriptor)
	s: unknown /* const array */
}

export type cl_short2Descriptor = { s: unknown /* const array */ }

export declare class cl_short2 {
	constructor(init?: cl_short2Descriptor)
	s: unknown /* const array */
}

export type cl_float2Descriptor = { s: unknown /* const array */ }

export declare class cl_float2 {
	constructor(init?: cl_float2Descriptor)
	s: unknown /* const array */
}

export type cl_long8Descriptor = { s: unknown /* const array */ }

export declare class cl_long8 {
	constructor(init?: cl_long8Descriptor)
	s: unknown /* const array */
}

export type cl_int2Descriptor = { s: unknown /* const array */ }

export declare class cl_int2 {
	constructor(init?: cl_int2Descriptor)
	s: unknown /* const array */
}

export type cl_short8Descriptor = { s: unknown /* const array */ }

export declare class cl_short8 {
	constructor(init?: cl_short8Descriptor)
	s: unknown /* const array */
}

export type cl_uint16Descriptor = { s: unknown /* const array */ }

export declare class cl_uint16 {
	constructor(init?: cl_uint16Descriptor)
	s: unknown /* const array */
}

export type cl_ushort8Descriptor = { s: unknown /* const array */ }

export declare class cl_ushort8 {
	constructor(init?: cl_ushort8Descriptor)
	s: unknown /* const array */
}

export type cl_int16Descriptor = { s: unknown /* const array */ }

export declare class cl_int16 {
	constructor(init?: cl_int16Descriptor)
	s: unknown /* const array */
}

export type cl_double2Descriptor = { s: unknown /* const array */ }

export declare class cl_double2 {
	constructor(init?: cl_double2Descriptor)
	s: unknown /* const array */
}

export type cl_ushort4Descriptor = { s: unknown /* const array */ }

export declare class cl_ushort4 {
	constructor(init?: cl_ushort4Descriptor)
	s: unknown /* const array */
}

export type cl_char16Descriptor = { s: unknown /* const array */ }

export declare class cl_char16 {
	constructor(init?: cl_char16Descriptor)
	s: unknown /* const array */
}

export type cl_float8Descriptor = { s: unknown /* const array */ }

export declare class cl_float8 {
	constructor(init?: cl_float8Descriptor)
	s: unknown /* const array */
}

export type cl_ushort16Descriptor = { s: unknown /* const array */ }

export declare class cl_ushort16 {
	constructor(init?: cl_ushort16Descriptor)
	s: unknown /* const array */
}

export type cl_uint8Descriptor = { s: unknown /* const array */ }

export declare class cl_uint8 {
	constructor(init?: cl_uint8Descriptor)
	s: unknown /* const array */
}

export type cl_uchar8Descriptor = { s: unknown /* const array */ }

export declare class cl_uchar8 {
	constructor(init?: cl_uchar8Descriptor)
	s: unknown /* const array */
}

export type cl_ulong16Descriptor = { s: unknown /* const array */ }

export declare class cl_ulong16 {
	constructor(init?: cl_ulong16Descriptor)
	s: unknown /* const array */
}

export type cl_uchar16Descriptor = { s: unknown /* const array */ }

export declare class cl_uchar16 {
	constructor(init?: cl_uchar16Descriptor)
	s: unknown /* const array */
}

export type cl_ulong4Descriptor = { s: unknown /* const array */ }

export declare class cl_ulong4 {
	constructor(init?: cl_ulong4Descriptor)
	s: unknown /* const array */
}

export type cl_uchar2Descriptor = { s: unknown /* const array */ }

export declare class cl_uchar2 {
	constructor(init?: cl_uchar2Descriptor)
	s: unknown /* const array */
}

export type cl_ulong2Descriptor = { s: unknown /* const array */ }

export declare class cl_ulong2 {
	constructor(init?: cl_ulong2Descriptor)
	s: unknown /* const array */
}

export declare function clGetPlatformIDs(
	p1: number,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function clGetPlatformInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clGetDeviceIDs(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clGetDeviceInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clCreateSubDevices(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clRetainDevice(p1: interop.PointerConvertible): number

export declare function clReleaseDevice(p1: interop.PointerConvertible): number

export declare function clCreateContext(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: (
		p1: string,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateContextFromType(
	p1: interop.PointerConvertible,
	p2: number,
	p3: (
		p1: string,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainContext(p1: interop.PointerConvertible): number

export declare function clReleaseContext(p1: interop.PointerConvertible): number

export declare function clGetContextInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clCreateCommandQueue(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainCommandQueue(p1: interop.PointerConvertible): number

export declare function clReleaseCommandQueue(p1: interop.PointerConvertible): number

export declare function clGetCommandQueueInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clCreateBuffer(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateSubBuffer(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateImage(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainMemObject(p1: interop.PointerConvertible): number

export declare function clReleaseMemObject(p1: interop.PointerConvertible): number

export declare function clGetSupportedImageFormats(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clGetMemObjectInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clGetImageInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clSetMemObjectDestructorCallback(
	p1: interop.PointerConvertible,
	p2: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	p3: interop.PointerConvertible,
): number

export declare function clCreateSampler(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainSampler(p1: interop.PointerConvertible): number

export declare function clReleaseSampler(p1: interop.PointerConvertible): number

export declare function clGetSamplerInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clCreateProgramWithSource(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateProgramWithBinary(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateProgramWithBuiltInKernels(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: string,
	p5: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainProgram(p1: interop.PointerConvertible): number

export declare function clReleaseProgram(p1: interop.PointerConvertible): number

export declare function clBuildProgram(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: string,
	p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	p6: interop.PointerConvertible,
): number

export declare function clCompileProgram(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: string,
	p5: number,
	p6: interop.PointerConvertible,
	p7: interop.PointerConvertible,
	p8: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	p9: interop.PointerConvertible,
): number

export declare function clLinkProgram(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: string,
	p5: number,
	p6: interop.PointerConvertible,
	p7: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): interop.Pointer

export declare function clUnloadPlatformCompiler(p1: interop.PointerConvertible): number

export declare function clGetProgramInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clGetProgramBuildInfo(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clCreateKernel(
	p1: interop.PointerConvertible,
	p2: string,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateKernelsInProgram(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
): number

export declare function clRetainKernel(p1: interop.PointerConvertible): number

export declare function clReleaseKernel(p1: interop.PointerConvertible): number

export declare function clSetKernelArg(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
): number

export declare function clGetKernelInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clGetKernelArgInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clGetKernelWorkGroupInfo(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clWaitForEvents(p1: number, p2: interop.PointerConvertible): number

export declare function clGetEventInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clCreateUserEvent(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): interop.Pointer

export declare function clRetainEvent(p1: interop.PointerConvertible): number

export declare function clReleaseEvent(p1: interop.PointerConvertible): number

export declare function clSetUserEventStatus(p1: interop.PointerConvertible, p2: number): number

export declare function clSetEventCallback(
	p1: interop.PointerConvertible,
	p2: number,
	p3: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void,
	p4: interop.PointerConvertible,
): number

export declare function clGetEventProfilingInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clFlush(p1: interop.PointerConvertible): number

export declare function clFinish(p1: interop.PointerConvertible): number

export declare function clEnqueueReadBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueReadBufferRect(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: number,
	p9: number,
	p10: number,
	p11: interop.PointerConvertible,
	p12: number,
	p13: interop.PointerConvertible,
	p14: interop.PointerConvertible,
): number

export declare function clEnqueueWriteBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueWriteBufferRect(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: number,
	p9: number,
	p10: number,
	p11: interop.PointerConvertible,
	p12: number,
	p13: interop.PointerConvertible,
	p14: interop.PointerConvertible,
): number

export declare function clEnqueueFillBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueCopyBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueCopyBufferRect(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: number,
	p9: number,
	p10: number,
	p11: number,
	p12: interop.PointerConvertible,
	p13: interop.PointerConvertible,
): number

export declare function clEnqueueReadImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: number,
	p10: interop.PointerConvertible,
	p11: interop.PointerConvertible,
): number

export declare function clEnqueueWriteImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: number,
	p10: interop.PointerConvertible,
	p11: interop.PointerConvertible,
): number

export declare function clEnqueueFillImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: number,
	p7: interop.PointerConvertible,
	p8: interop.PointerConvertible,
): number

export declare function clEnqueueCopyImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueCopyImageToBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueCopyBufferToImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueMapBuffer(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: number,
	p6: number,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
	p10: interop.PointerConvertible,
): interop.Pointer

export declare function clEnqueueMapImage(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: interop.PointerConvertible,
	p8: interop.PointerConvertible,
	p9: number,
	p10: interop.PointerConvertible,
	p11: interop.PointerConvertible,
	p12: interop.PointerConvertible,
): interop.Pointer

export declare function clEnqueueUnmapMemObject(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clEnqueueMigrateMemObjects(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
	p7: interop.PointerConvertible,
): number

export declare function clEnqueueNDRangeKernel(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
	p7: number,
	p8: interop.PointerConvertible,
	p9: interop.PointerConvertible,
): number

export declare function clEnqueueTask(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clEnqueueNativeKernel(
	p1: interop.PointerConvertible,
	p2: (p1: interop.PointerConvertible) => void,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
	p7: interop.PointerConvertible,
	p8: number,
	p9: interop.PointerConvertible,
	p10: interop.PointerConvertible,
): number

export declare function clEnqueueMarkerWithWaitList(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
): number

export declare function clEnqueueBarrierWithWaitList(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
): number

export declare function clGetExtensionFunctionAddressForPlatform(
	p1: interop.PointerConvertible,
	p2: string,
): interop.Pointer

export declare function clCreateImage2D(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: number,
	p7: interop.PointerConvertible,
	p8: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateImage3D(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: number,
	p7: number,
	p8: number,
	p9: interop.PointerConvertible,
	p10: interop.PointerConvertible,
): interop.Pointer

export declare function clEnqueueMarker(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
): number

export declare function clEnqueueWaitForEvents(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
): number

export declare function clEnqueueBarrier(p1: interop.PointerConvertible): number

export declare function clUnloadCompiler(): number

export declare function clGetExtensionFunctionAddress(p1: string): interop.Pointer

export declare function clCreateFromGLBuffer(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateFromGLTexture(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateFromGLRenderbuffer(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
): interop.Pointer

export declare function clGetGLObjectInfo(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): number

export declare function clGetGLTextureInfo(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
): number

export declare function clEnqueueAcquireGLObjects(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clEnqueueReleaseGLObjects(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clCreateFromGLTexture2D(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateFromGLTexture3D(
	p1: interop.PointerConvertible,
	p2: number,
	p3: number,
	p4: number,
	p5: number,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clGetGLContextInfoAPPLE(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: number,
	p4: number,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): number

export declare function clCreateEventFromGLsyncKHR(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateImageFromIOSurface2DAPPLE(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: number,
	p5: number,
	p6: interop.Object,
	p7: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateImageFromIOSurfaceWithPropertiesAPPLE(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: interop.PointerConvertible,
	p6: interop.PointerConvertible,
): interop.Pointer

export declare function clSetMemObjectDestructorAPPLE(
	p1: interop.PointerConvertible,
	p2: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	p3: interop.PointerConvertible,
): number

export declare function clLogMessagesToSystemLogAPPLE(
	p1: string,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
): void

export declare function clLogMessagesToStdoutAPPLE(
	p1: string,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
): void

export declare function clLogMessagesToStderrAPPLE(
	p1: string,
	p2: interop.PointerConvertible,
	p3: number,
	p4: interop.PointerConvertible,
): void

export declare function clCreateContextAndCommandQueueAPPLE(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: (
		p1: string,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => void,
	p5: interop.PointerConvertible,
	p6: number,
	p7: interop.PointerConvertible,
	p8: interop.PointerConvertible,
): number

export declare function clCreateProgramAndKernelsWithSourceAPPLE(
	p1: interop.PointerConvertible,
	p2: number,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
	p5: number,
	p6: interop.PointerConvertible,
	p7: string,
	p8: number,
	p9: interop.PointerConvertible,
	p10: interop.PointerConvertible,
	p11: interop.PointerConvertible,
): number

export declare function clSetKernelArgsListAPPLE(p1: interop.PointerConvertible, p2: number): number

export declare function clSetKernelArgsVaListAPPLE(
	p1: interop.PointerConvertible,
	p2: number,
	p3: string,
): number

export declare function clSetKernelArgByNameAPPLE(
	p1: interop.PointerConvertible,
	p2: string,
	p3: number,
	p4: interop.PointerConvertible,
): number

export declare function clCreateDAGAPPLE(c: interop.PointerConvertible): interop.Pointer

export declare function clReleaseDAGAPPLE(dag: interop.PointerConvertible): void

export declare function clGetDAGNodeAPPLE(
	d: interop.PointerConvertible,
	f: interop.PointerConvertible,
	args: interop.PointerConvertible,
	arg_indices: interop.PointerConvertible,
	nargs: number,
): number

export declare function clCreateKernelFromDAGAPPLE(
	d: interop.PointerConvertible,
	n: number,
	list: interop.PointerConvertible,
): interop.Pointer

export declare function clCreateCommandQueueWithPropertiesAPPLE(
	p1: interop.PointerConvertible,
	p2: interop.PointerConvertible,
	p3: interop.PointerConvertible,
	p4: interop.PointerConvertible,
): interop.Pointer

export declare function gcl_create_dispatch_queue(
	flags: number,
	device_id: interop.PointerConvertible,
): NSObject

export declare function gcl_malloc(
	bytes: number,
	host_ptr: interop.PointerConvertible,
	flags: number,
): interop.Pointer

export declare function gcl_free(ptr: interop.PointerConvertible): void

export declare function gcl_create_image(
	image_format: interop.PointerConvertible,
	image_width: number,
	image_height: number,
	image_depth: number,
	io_surface: interop.Object,
): interop.Pointer

export declare function gcl_retain_image(image: interop.PointerConvertible): void

export declare function gcl_release_image(image: interop.PointerConvertible): void

export declare function gcl_get_supported_image_formats(
	device_id: interop.PointerConvertible,
	image_type: number,
	num_entries: number,
	image_formats: interop.PointerConvertible,
	num_image_formats: interop.PointerConvertible,
): void

export declare function gcl_memcpy(
	dst: interop.PointerConvertible,
	src: interop.PointerConvertible,
	size: number,
): void

export declare function gcl_memcpy_rect(
	dst: interop.PointerConvertible,
	src: interop.PointerConvertible,
	dst_origin: unknown /* const array */,
	src_origin: unknown /* const array */,
	region: unknown /* const array */,
	dst_row_pitch: number,
	dst_slice_pitch: number,
	src_row_pitch: number,
	src_slice_pitch: number,
): void

export declare function gcl_copy_image(
	dst_image: interop.PointerConvertible,
	src_image: interop.PointerConvertible,
	dst_origin: unknown /* const array */,
	src_origin: unknown /* const array */,
	region: unknown /* const array */,
): void

export declare function gcl_copy_ptr_to_image(
	dst_image: interop.PointerConvertible,
	src_ptr: interop.PointerConvertible,
	dst_origin: unknown /* const array */,
	region: unknown /* const array */,
): void

export declare function gcl_copy_image_to_ptr(
	dst_ptr: interop.PointerConvertible,
	src_image: interop.PointerConvertible,
	src_origin: unknown /* const array */,
	region: unknown /* const array */,
): void

export declare function gcl_map_ptr(
	ptr: interop.PointerConvertible,
	map_flags: number,
	cb: number,
): interop.Pointer

export declare function gcl_map_image(
	image: interop.PointerConvertible,
	map_flags: number,
	origin: unknown /* const array */,
	region: unknown /* const array */,
): interop.Pointer

export declare function gcl_unmap(p1: interop.PointerConvertible): void

export declare function gcl_create_kernel_from_block(
	kernel_block_ptr: interop.PointerConvertible,
): interop.Pointer

export declare function gcl_get_kernel_block_workgroup_info(
	kernel_block_ptr: interop.PointerConvertible,
	param_name: number,
	param_value_size: number,
	param_value: interop.PointerConvertible,
	param_value_size_ret: interop.PointerConvertible,
): void

export declare function gcl_get_device_id_with_dispatch_queue(queue: NSObject): interop.Pointer

export declare function gcl_set_finalizer(
	object: interop.PointerConvertible,
	cl_pfn_finalizer: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
	user_data: interop.PointerConvertible,
): void

export declare function gcl_start_timer(): number

export declare function gcl_stop_timer(t: number): number

export declare function gcl_create_buffer_from_ptr(ptr: interop.PointerConvertible): interop.Pointer

export declare function gcl_gl_create_ptr_from_buffer(bufobj: number): interop.Pointer

export declare function gcl_gl_create_image_from_texture(
	texture_target: number,
	mip_level: number,
	texture: number,
): interop.Pointer

export declare function gcl_gl_create_image_from_renderbuffer(
	render_buffer: number,
): interop.Pointer

export declare function gcl_gl_set_sharegroup(share: interop.PointerConvertible): void

export declare function gcl_get_context(): interop.Pointer
