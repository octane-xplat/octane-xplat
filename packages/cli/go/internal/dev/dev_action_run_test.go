package dev

import (
	"reflect"
	"testing"
)

func TestSelectActionRunInstance(t *testing.T) {
	revision := int64(0)
	phone := actionRunInstance{ID: "phone", Target: "ios-sim", Platform: "ios", State: "ready", Revision: &revision}
	browser := actionRunInstance{ID: "browser", Target: "web", Platform: "web", State: "ready"}
	tab := actionRunInstance{ID: "tab", Target: "web", Platform: "web", State: "ready"}
	disconnected := actionRunInstance{ID: "gone", Target: "ios-sim", Platform: "ios", State: "disconnected"}
	instances := []actionRunInstance{phone, browser, tab, disconnected}
	for _, tc := range []struct {
		name, target, instance string
		want                   actionRunInstance
		code                   string
		candidates             []actionRunInstance
	}{
		{name: "platform", target: "ios", want: phone},
		{name: "target ID", target: "ios-sim", want: phone},
		{name: "explicit instance", instance: "tab", want: tab},
		{name: "matching target and instance", target: "web", instance: "browser", want: browser},
		{name: "conflicting selectors", target: "ios", instance: "tab", code: "unavailable"},
		{name: "disconnected instance", instance: "gone", code: "unavailable"},
		{name: "ambiguous across targets", code: "ambiguous_selection", candidates: []actionRunInstance{phone, browser, tab}},
		{name: "ambiguous within target", target: "web", code: "ambiguous_selection", candidates: []actionRunInstance{browser, tab}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, failure := selectActionRunInstance(instances, tc.target, tc.instance)
			if tc.code == "" {
				if failure != nil || got != tc.want {
					t.Fatalf("got %+v, %v; want %+v", got, failure, tc.want)
				}
				return
			}
			if failure == nil || failure.Code != tc.code {
				t.Fatalf("got %v; want %s", failure, tc.code)
			}
			if tc.candidates != nil && !reflect.DeepEqual(failure.Context, map[string]any{"candidates": tc.candidates}) {
				t.Fatalf("unexpected candidates: %+v", failure.Context)
			}
		})
	}
}
