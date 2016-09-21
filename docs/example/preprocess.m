@implementation MyClass
#if DEBUG
-(void)method {
    // debug code
}
#else
-(void)method {
    // normal code
}
#endif
@end