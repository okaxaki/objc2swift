# Statement

## If Statement
```
@implementation Foo
-(NSString *)method {
    if(Condition) {
        return @"OK";
    } else {
        return @"NG";
    }
}
@end
```

```
class Foo {
    func method() -> String! {
        if Condition {
            return "OK"
        } else {
            return "NG"
        }
    }
}
```

## Switch Statement
```
@implementation Foo
-(NSString *)method {
    switch(Condition) {
        case Apple:
            return @"apple";
        case Orange:
            return @"orange";
        default:
            return @"else";    
    }
}
@end
```

```
class Foo {
    func method() -> String! {
        switch(Condition) { 
            case Apple:
                return "apple"
            case Orange:
                return "orange"
            default:
                return "else"    
        }
    }
}
```

## Switch Statement (sequential cases)
```
@implementation Foo
-(NSString *)method {
    switch(Condition) {
        case Apple:
        case Orange:
            return @"fruit";
        default:
            return @"else";
    }
}
@end
```
```
class Foo {
    func method() -> String! {
        switch(Condition) { 
            case Apple,
                 Orange:
                return "fruit"
            default:
                return "else"
        }
    }
}
```

## For Statement
```
@implementation Foo
-(void)method {
    for(int i=0;i<100;i++) {
        NSLog("%d",i);
    }
}
@end
```
```
class Foo {
    func method() {
        for var i:Int=0 ; i<100 ; i++ {  
            NSLog("%d",i)
         }
    }
}
```

## For-In Statement
```
@implementation Foo
-(void)method {
    for(int bar in Foo) {
        NSLog("%d",bar);
    }
}
@end
```

```
class Foo {
    func method() {
        for bar:Int in Foo {  
            NSLog("%d",bar)
         }
    }
}
```

## While Statement
```
@implementation Foo
-(void)method {
    while(flag) {
        // Do Something
    }
}
@end
```

```
class Foo {
    func method() {
        while flag {
            // Do Something
        }
    }
}
```

## Do-White Statement
```
@implementation Foo
-(void)method {
    do {
        // Do Something
    } while(flag);
}
@end
```
```
class Foo {
    func method() {
        repeat {
            // Do Something
        } while flag
    }
}
```

## Try-Catch Statment
<p>Since Swift's try-catch statement has different semantics from Objective-C's, <code>@try</code>, <code>@catch</code> and <code>@finally</code> keywords are not be converted.
</p>
```
@implementation Foo
-(void)method {
    @try {
        // ...
    }
    @catch(Error *err) {
    	// ...
    }
    @finally {
    	// ...
    }
}
@end
```
```
class Foo {
    func method() {
        @try {
            // ...
        }
        @catch(err:Error!) {
        	// ...
        }
        @finally {
        	// ...
        }
    }
}
```

## Jump and Labeled Statement
</p>
```
@implementation Foo
-(void)method {
    for(int i = 0; i < 100; i++) {
        if (i == 50) {
            goto bar;
        }
    }
    bar:
        return;
}
@end
```
```
class Foo {
    func method() {
        for var i:Int=0 ; i < 100 ; i++ {  
            if i == 50 {
                goto  bar
            }
         }
        bar:
            return
    }
}
```

