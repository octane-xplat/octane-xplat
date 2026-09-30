#import "XplatObjC.h"
#include "XplatC.h"
@implementation XplatObjCProbe
+ (int)value { return xplat_c_value() + 2; }
@end
