describe("Knob", function() {
    var $InvalidClasspath = "invalid class-path: ";
    var $NonExistentClass = "non-existent class: ";
    var $NonExistentSuperClass = "invalid super-class: ";
    var $InvalidProtobject = "invalid proto-object given for: ";

    var classpath = "MyClass";
    var superclasspath = "MySuperClass";
    var subclasspath = "MySubClass";
    var sub2classpath = "MySub2Class";

    beforeEach(function() {
    });

    afterEach(function() {
        knob(classpath, null);
        knob(superclasspath, null);
        knob(subclasspath, null);
        knob(sub2classpath, null);
    });

    it('should throw an error when retrieving invalid classpath', function() {
        expect(function(){knob()}).toThrow($InvalidClasspath + undefined);
        expect(function(){knob(null)}).toThrow($InvalidClasspath + "null");
        expect(function(){knob(undefined)}).toThrow($InvalidClasspath + "undefined");
        expect(function(){knob({})}).toThrow($InvalidClasspath + "[object Object]");
    });

    it('should throw an error when retrieving non-existant classpath', function() {
        expect(function(){knob(classpath)}).toThrow($NonExistentClass + classpath);
    });

    it('should throw an error when setting invalid classpath', function() {
        expect(function(){knob(null, {})}).toThrow($InvalidClasspath + "null");
        expect(function(){knob(undefined, {})}).toThrow($InvalidClasspath + "undefined");
        expect(function(){knob({}, {})}).toThrow($InvalidClasspath + "[object Object]");
    });

    it('should return a constructor function', function() {
        expect(typeof knob(classpath, {})).toEqual("function");
        // Should also make the constructor available at the specified path
        expect(typeof window[classpath]).toEqual("function");
    });

    it('should remove class if second parameter is null', function() {
        var constructor = knob(classpath, {});
        expect(typeof constructor).toEqual("function");

        var removedConstructor = knob(classpath, null);
        expect(removedConstructor).toEqual(constructor);

        expect(function(){knob(classpath)}).toThrow($NonExistentClass + classpath);
        // Should also remove the constructor from the specified path
        expect(window[classpath]).toBeUndefined();
    });

    it('should parse class namespace appropriately when setting up path', function () {
        var constructor = knob('x.y.z', {});
        expect(window.x.y.z).toEqual(constructor);

        knob('x.y.z', null);
        expect(window.x.y.z).toBeUndefined();
    });

    it('should throw an error when inheriting with invalid parameters', function() {
        expect(function(){knob(classpath, "", {})}).toThrow($NonExistentSuperClass);
        expect(function(){knob(classpath, superclasspath, {})}).toThrow($NonExistentSuperClass + superclasspath);

        knob(superclasspath,{});
        expect(function(){knob(classpath, superclasspath)}).toThrow($InvalidProtobject + classpath);
        expect(function(){knob(classpath, superclasspath, null)}).toThrow($InvalidProtobject + classpath);
    });

    it('should return the registered constructor when called again with the same path', function() {
        var constructor = knob(classpath, {});
        expect(knob(classpath)).toEqual(constructor);
    });

    it('should overwrite previous class when called twice', function() {
        var constructor1 = knob(classpath, {});
        var constructor2 = knob(classpath, {});
        expect(constructor2).toNotEqual(constructor1);
        expect(knob(classpath)).toEqual(constructor2);
    });

    it('should set prototype based on given proto-object', function() {
        var MyClass = knob(classpath, {
            myProp: 41,
            myFunc: function() {
                this.myProp++;
            }
        });
        var myObj = new MyClass();
        myObj.myFunc();
        expect(myObj.myProp).toEqual(42);
    });

    it('should set prototype chain from given superclass', function() {
        var SuperClass = knob(superclasspath, {});
        var SubClass = knob(subclasspath, SuperClass, {});
        expect((new SubClass()) instanceof SuperClass).toBeTruthy();

        var sub2class = knob(sub2classpath, SubClass, {});
        expect((new sub2class()) instanceof SuperClass).toBeTruthy();
    });

    it('should set prototype chain from given superclass path', function() {
        var SuperClass = knob(superclasspath, {});
        var SubClass = knob(subclasspath, superclasspath, {});
        expect((new SubClass()) instanceof SuperClass).toBeTruthy();

        var sub2class = knob(sub2classpath, subclasspath, {});
        expect((new sub2class()) instanceof SuperClass).toBeTruthy();
    });

    it('should set prototype from superclass and proto-object', function() {
        var SuperClass = knob(superclasspath, {
            myProp: 41
        });
        var SubClass = knob(subclasspath, SuperClass, {
            myFunc: function() {
                this.myProp++;
            }
        });
        var subObj = new SubClass();
        expect(subObj instanceof SuperClass).toBeTruthy();

        subObj.myFunc();
        expect(subObj.myProp).toEqual(42);
    });

    it('should call initilize method of each class in correct order', function() {
        var proof = "";
        var SuperClass = knob(superclasspath, {
            initialize: function() {
                proof += "1";
            }
        });
        var SubClass = knob(subclasspath, SuperClass, {
            initialize: function() {
                SubClass.$super.initialize.call(this);
                proof += "2";
            }
        });
        var Sub2class = knob(sub2classpath, SubClass, {
            initialize: function() {
                Sub2class.$super.initialize.call(this);
                proof += "3";
            }
        });

        new Sub2class();
        expect(proof).toEqual("123");
    });

    it('should call initilize method of each class with correct parameters', function() {
        var proof = "";
        var SuperClass = knob(superclasspath, {
            initialize: function(arg) {
                proof += arg;
            }
        });
        var SubClass = knob(subclasspath, SuperClass, {
            initialize: function(arg) {
                SubClass.$super.initialize.call(this, "1");
                proof += arg;
            }
        });
        var Sub2class = knob(sub2classpath, SubClass, {
            initialize: function(arg) {
                Sub2class.$super.initialize.call(this, "2");
                proof += arg;
            }
        });

        new Sub2class("3");
        expect(proof).toEqual("123");
    });

    it('should skip missing superclass initilize method', function() {
        var proof = "";
        var SuperClass = knob(superclasspath, {
            initialize: function() {
                proof += "1";
            }
        });
        var SubClass = knob(subclasspath, SuperClass, {});
        var Sub2class = knob(sub2classpath, SubClass, {
            initialize: function() {
                Sub2class.$super.initialize.call(this);
                proof += "2";
            }
        });

        new Sub2class();
        expect(proof).toEqual("12");
    });

    it('should skip missing subclass initilize method', function() {
        var proof = "";
        var SuperClass = knob(superclasspath, {
            initialize: function() {
                proof += "1";
            }
        });
        var SubClass = knob(subclasspath, SuperClass, {
            initialize: function() {
                SubClass.$super.initialize.call(this);
                proof += "2";
            }
        });
        var Sub2class = knob(sub2classpath, SubClass, {});

        new Sub2class();
        expect(proof).toEqual("12");
    });

    it('should create distinct observable instances for each created object', function() {
        var constructor = knob(classpath, {
            item: knob.observable(1)
        });
        var obj1 = new constructor();
        expect(obj1.item()).toEqual(1);

        var obj2 = new constructor();
        obj2.item(2);
        expect(obj2.item()).toEqual(2);
        expect(obj1.item()).toEqual(1);
    });

    it('should create distinct observable array instances for each created object', function() {
        var constructor = knob(classpath, {
            item: knob.observableArray()
        });
        var obj1 = new constructor();
        obj1.item([1,2,3]);
        expect(obj1.item()).toEqual([1,2,3]);

        var obj2 = new constructor();
        obj2.item([7,8,9]);
        expect(obj2.item()).toEqual([7,8,9]);
        expect(obj1.item()).toEqual([1,2,3]);
    });

    it('should create distinct computed instances for each created object', function() {
        var constructor = knob(classpath, {
            item: knob.observable(1),
            comp: knob.computed(function() {
                return this.item() * 2;
            })
        });
        var obj1 = new constructor();
        expect(obj1.comp()).toEqual(2);

        var obj2 = new constructor();
        obj2.item(2);
        expect(obj2.comp()).toEqual(4);
        expect(obj1.comp()).toEqual(2);
    });

    it('should reference correct "this" value in bound functions', function() {
        var constructor = knob(classpath, {
            unboundMethod: function(toTest) {
                expect(this).toEqual(toTest);
            },
            boundMethod: knob.bound(function(toTest) {
                expect(this).toEqual(toTest);
            })
        });
        var obj = new constructor();
        var unboundRef = obj.unboundMethod, boundRef = obj.boundMethod;
        unboundRef(window);
        boundRef(obj);
    });
});
