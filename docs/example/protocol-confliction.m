@interface Foo
@end

// Objective-C allows the same protocol name with 
// the class but Swift doesn't. 
// suffix `-Protocol` is added to the Swift 
// protocol if name confliction is found.
@protocol Foo 
@end

@protocol Bar
@end

@interface MyClass : Foo<Foo,Bar>
@property Foo *oFoo;
@property id<Foo> pFoo;
@property id<Bar> pBar;
@end

@implementation MyClass 
@end
