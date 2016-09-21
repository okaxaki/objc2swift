@interface MyClass
@property NSString *prop;
@property (readonly) NSString *ro;
@property NSNumber *comp; 
@end

@implementation MyClass 
@synthesize comp = _rawValue;
-(void)setComp:(NSNumber *)value {
    _rawValue = value / 2;
}
-(NSNumber *)comp {
    return _rawValue * 2;
}
@end
