describe("Knob", function() {
    var $InvalidClasspath/*String*/ = "invalid class-path: ";
    var $NonExistentClass/*String*/ = "non-existent class: ";
    var $NonExistentSuperClass/*String*/ = "invalid super-class: ";
    var $InvalidProtobject/*String*/ = "invalid proto-object given for: ";

    var classpath/*String*/ = "MyClass";
    var superclasspath/*String*/ = "MySuperClass";
    var subclasspath/*String*/ = "MySubClass";
    var sub2classpath/*String*/ = "MySub2Class";

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
    });

    it('should throw an error inheriting with invalid parameters', function() {
        expect(function(){knob(classpath, "", {})}).toThrow($NonExistentSuperClass);
        expect(function(){knob(classpath, superclasspath, {})}).toThrow($NonExistentSuperClass + superclasspath);

        knob(superclasspath,{});
        expect(function(){knob(classpath, superclasspath)}).toThrow($InvalidProtobject + classpath);
        expect(function(){knob(classpath, superclasspath, null)}).toThrow($InvalidProtobject + classpath);
    });

});
