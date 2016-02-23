# Class 

## Class method
```
@implementation Foo
+(int)method {
    return 0;
}
@end
```

```
class Foo {
    class func method() -> Int {
        return 0
    }
}
```

## Instance method
```
@implementation Foo
-(int)method {
    return 0;
}
@end
```

```
class Foo {
    func method() -> Int {
        return 0
    }
}
```

## Method with params
```
@implementation Foo 
-(void)method:(int)arg1 label:(NSString *)arg2 {}
-(void)method2:(int)arg1 :(NSString *)arg2 {}
-(void)method3:(int)arg1 arg2:(NSString *)arg2 {}
@end
```
```
class Foo { 
    func method(arg1:Int, label arg2:String!) {}
    func method2(arg1:Int, arg2:String!) {}
    func method3(arg1:Int, arg2:String!) {}
}
```

## Override Completion

```
@interface SuperFoo
-(void)someMethod:(NSNumber *)arg;
@end

@interface Foo : SuperFoo
-(void)someMethod:(NSNumber *)arg;
@end

@implementation Foo
-(void)someMethod:(NSNumber *)arg {
    // ...
}
@end
```

```
class Foo : SuperFoo {
    override func someMethod(arg:NSNumber!) {
        // ...
    }
}
```

## Respect Interface declaration
<p>If the signature of the method implementation is different from interface,
the generated swift code follows interface declaration. Such patterns are mostly apparel with nullability specifiers.
</p>

```
@interface Foo
-(NSString * nonnull)method;
@end

@implementation Foo
-(NSString *)method {
    // ...
}
@end
```

```
class Foo {
    func method() -> String {
        // ...
    }
}
```

