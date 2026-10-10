#import <Foundation/Foundation.h>
#import <Network/Network.h>

// Drive only Apple's status/interface inputs; exercise the production mapper.
static nw_path_status_t testStatus;
static nw_interface_type_t testInterface;
static nw_path_status_t testGetStatus(nw_path_t path) { return testStatus; }
static bool testUsesInterface(nw_path_t path, nw_interface_type_t type) { return type == testInterface; }
#define nw_path_get_status testGetStatus
#define nw_path_uses_interface_type testUsesInterface
#import "../platforms/macos/src/XplatConnectivity.m"

static void check(nw_path_status_t status, nw_interface_type_t interface, BOOL supported, BOOL online, NSString *type) {
    testStatus = status;
    testInterface = interface;
    NSData *data = [stateForPath(nil) dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *state = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    NSCAssert([state[@"supported"] boolValue] == supported, @"Support differs");
    NSCAssert([state[@"online"] boolValue] == online, @"Online differs");
    NSCAssert([state[@"type"] isEqualToString:type], @"Transport differs");
}

int main(void) {
    @autoreleasepool {
        check(nw_path_status_invalid, nw_interface_type_wifi, NO, NO, @"unknown");
        check(nw_path_status_unsatisfied, nw_interface_type_wifi, YES, NO, @"none");
        check(nw_path_status_satisfiable, nw_interface_type_cellular, YES, NO, @"none");
        check(nw_path_status_satisfied, nw_interface_type_wifi, YES, YES, @"wifi");
        check(nw_path_status_satisfied, nw_interface_type_wired, YES, YES, @"ethernet");
        check(nw_path_status_satisfied, nw_interface_type_cellular, YES, YES, @"mobile");
        check(nw_path_status_satisfied, nw_interface_type_other, YES, YES, @"unknown");
        puts("NATIVE_CONNECTIVITY_MAPPING_OK");
    }
    return 0;
}
