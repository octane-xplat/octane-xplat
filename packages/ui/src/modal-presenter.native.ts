/** Resolve the view `showModal` should present from: the frame's current
 *  page while it's live, else the frame itself. During push/pop churn
 *  `currentPage` can still point at a page that already left the window —
 *  presenting on a detached iOS VC silently drops the modal and its
 *  closeCallback never runs, hanging `openModal`/`Modal` forever. A page
 *  is a valid presenter only while it is loaded and still owned by the
 *  frame (`page.frame` is the page's parent link, cleared on detach).
 *  Returns null when nothing live can present — callers must surface that
 *  rather than presenting blind. `frame` is structural: `Frame.topmost()`
 *  types as FrameBase while stack registration hands over Frame. */
export function modalPresenter(
	frame: { currentPage?: any; isLoaded?: boolean } | undefined | null,
): any {
	if (!frame) {
		return null
	}

	const page = frame.currentPage as any
	if (page && page.isLoaded && page.frame === frame) {
		return page
	}

	return (frame as any).isLoaded ? frame : null
}
