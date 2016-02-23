# Prorotol

## Protocol Declaration

Note the converter does not generate Swift protocol code if the protocol declaration is found in the imported header.
If you would like to get Swift protocol code, pass the header file where the protocol is declared to the converter.

```
@protocol MyProtocol
@property int property;
@property (readonly) int readonlyProperty;
+(void)classMethod;
-(void)method;
@optional
@property int optionalProperty;
-(void)optionalClassMethod;
-(void)optionalMethod;
@end
```

```
protocol MyProtocol {
    var property:Int { get set }
    var readonlyProperty:Int { get }
    class func classMethod()
    func method()

    optional var optionalProperty:Int { get set }
    optional func optionalClassMethod()
    optional func optionalMethod()
}
```

## Protocol Reference

```
@interface Foo : NSObject <Bar, Baz>
@end

@implementation Foo
// ...
@end
```

```
class Foo : NSObject, Bar, Baz {
// ...
}
```

## Protocol Name Confliction

```
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
```

```
// Objective-C allows the same protocol name with 
// the class but Swift doesn't. 
// suffix `-Protocol` is added to the Swift 
// protocol if name confliction is found.


class MyClass : Foo, FooProtocol, Bar { 
    var oFoo:Foo!
    var pFoo:FooProtocol!
    var pBar:Bar!
}
```
