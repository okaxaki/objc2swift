# Miscellaneous

## Assignment analysis
```
@implementation MyClass
-(void)test {
    NSString *foo = @"FOO";
    NSString *bar = @"BAR";

    foo = @"baz";    
    // ... 
    return foo;
}
@end
```

```
class MyClass {
    func test() {
        var foo:String! = "FOO"
        let bar:String! = "BAR"

        foo = "baz"    
        // ... 
        return foo
    }
}
```

## NULL check idiom

```
@implementation MyClass
-(void)test:(NSString *)str {
    if(!str) {
        NSLog(@"str is NULL");
    }
}
@end
```

```
class MyClass {
    func test(str:String!) {
        if (str == nil) {
            NSLog("str is NULL")
        }
    }
}
```

## class Keyword

```
void test() {

    NSString *str;

    // Get type from class.
    [NSString class];
    NSString.class;

    // Get dynamic type from instance.
    [str class];
    str.class;

}
```

```
func test() {

    var str:String!

    // Get type from class.
    String.self
    String.self

    // Get dynamic type from instance.
    str.dynamicType
    str.dynamicType

}
```

## isKindOfClass
```
void test(id obj) {
    if([obj isKindOfClass:[NSString class]]) {
        // Do something
    }
}
```

```
func test(obj:AnyObject!) {
    if (obj is NSString) {
        // Do something
    }
}
```

## instancetype
```
@implementation Foo
-(instancetype)method {
    // ...
    return self;
}
@end
```

```
class Foo {
    func method() -> Self {
        // ...
        return self
    }
}
```

## @available
```
@implementation MyClass
-(void)test {
    if(@available(iOS 10.0, *)) {
        // >= iOS10
    } else {
        // <= iOS9
    }
}
@end
```

```
class MyClass {
    func test() {
        if #available(iOS 10.0, *) {
            // >= iOS10
        } else {
            // <= iOS9
        }
    }
}
```

