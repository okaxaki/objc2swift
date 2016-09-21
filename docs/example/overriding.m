@interface SuperFoo
-(void)method:(NSNumber *)arg;
@end

@interface Foo : SuperFoo
-(void)method:(NSNumber *)arg;
-(void)method2:(NSNumber *)arg;
@end

@implementation Foo
-(void)method:(NSNumber *)arg {
    // ...
}

-(void)method2:(NSNumber *)arg {
    // ...
}

@end