// Initializer conversion is not perfect.
// Only method signature is converted to `init` schema.
@implementation MyClass
-(instancetype)init {
    self = [super init];
    if(self) {
        // ...
    }
    return self;
}

-(instancetype)initWithFrame:(CGFrame)frame {
    self = [super init];
    if(self) {
        // ...
    }
    return self;
}
@end