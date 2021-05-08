/********************************************

    (c) Copyright 2018 - JDA IT Solutions - Julien Darrort
    All rights reserved. 

*********************************************/
/**
 *
 * Check Interface Contract , 
 * Filter inputs with only the required attributes
 * Verify the type
 * 
 */
const LOGGER = require('./logger');
const ERR   = require('./error');

class DitfError extends Error {
    constructor(in_type, in_pbs) {
        super();
        this.code = in_type;
        this.pbs = in_pbs;
    }
}
const DITF_ERROR = {
    CHECK_FAILED : 1,
    NO_DATA : 2,
}
var DItf = {
    modules: {}
};
//-----------------------------------------------
LOGGER.register(DItf, "DItf");

//-----------------------------------------------
DItf.valid_types = {
    "number": function(inputs, key, rule ) { 
        if (isNaN(Number(inputs[key]))) {return false;}
        else {inputs[key] = Number(inputs[key]); return true;}
    },
    "integer" : function(inputs, key, rule ) {
        if (isNaN(Number(inputs[key])) || !Number.isInteger(Number(inputs[key]))) {return false;}
        else {inputs[key] = Number(inputs[key]);return true;}
    },
    "enum" : function(inputs, key, rule ) { 
        return  (rule.enum.indexOf(inputs[key]) != -1)
    },
    "json" : function(inputs, key, rule ) { 
        return ( typeof inputs[key] == "object"); 
    },          
    "date" : function(inputs, key, rule ) { 
        let d ;
        if (rule.mandatory == 'N' && !inputs[key]  ) return true;
        try {
            d = new Date(inputs[key]);
            if (d.getFullYear()> 2000 && d.getFullYear() < 2040) {
                inputs[key] = d;
                return true;
            }
        } catch (e) { return false;}
    },
    "string" : function(inputs, key, rule ) { 
        return  ( typeof inputs[key] == "string");
    },
    "string_notnull" : function(inputs, key, rule ) { 
        return  ( typeof inputs[key] == "string" && inputs[key].length >0 );
    },
    "any" : function() { return true;},
    "array" :  function(inputs, key, rule ) { return Array.isArray(inputs[key]) ;}
}

//-----------------------------------------------
DItf.registerType = function(in_type_name, in_fn)  {
    if (this.valid_types.indexOf(in_type_name) != -1) {
        throw ERR.UnhandledException(" Type d'interface déjà défini : " + in_type_name);
    }
    else {
        DItf.valid_types[in_type_name]  = in_fn;
    }
}

//-----------------------------------------------
// Register a new interface and its associated rules
DItf.registerRules = function( in_mod_name, in_itf_name, in_rules){
    try {
        if (this.modules[in_mod_name] === undefined) this.modules[in_mod_name] = {rules:{}};
        // Build Rules
        // Upon Failure ==> Unrecoverable
        this.dbg("Registering Interface" + in_mod_name + "/"+in_itf_name);
        this.modules[in_mod_name].rules[in_itf_name] = this.buildRules(in_rules);
        return true;
    } catch (e) {
        this.err("!!!!Failed to build rules for "+ in_mod_name +"/" + in_itf_name);
        process.exit(-1);
    }
}

//-----------------------------------------------
// Check if rules are defined for an interface
DItf.hasRule = function( in_mod_name, in_itf_name){
    return  (  this.modules[in_mod_name]  && this.modules[in_mod_name].rules[in_itf_name] );
}

//-----------------------------------------------
DItf.buildItfData = function(in_mod_name, in_itf_name, inputs, skip_filter){
    // Check Existence of Itf
    if (! this.modules[in_mod_name].rules[in_itf_name] ) {
        this.err(`Could not found rules for module=${in_mod_name}, itf=${in_itf_name}`);
        throw ERR.ServerException("No corresponding API Definition");

    }
    //Filter Inputs data against Rule
    let filtered_inputs = this.inputFilter(this.modules[in_mod_name].rules[in_itf_name], inputs);
    //Check Inputs data conformity against Rule
    try {
        this.inputChecker(this.modules[in_mod_name].rules[in_itf_name], filtered_inputs) ;
    } catch (e) {
        switch (e.code) {
            case DITF_ERROR.CHECK_FAILED : 
                this.err(" Could not validate interface " + in_mod_name + "/"+ in_itf_name );
                throw ERR.InvalidAttr(`Invalid Attribute (${e.pbs.join("/")})`);
            case DITF_ERROR.NO_DATA : 
                // not really an error
                break;
            default : 
                throw ERR.ServerException("Failed to validate request");
        }
    }
    if ( skip_filter){
        // keep attributes that were not targeted in itf rules.
        return inputs;
    }

    return filtered_inputs;
}


//-----------------------------------------------
/*
$in_template : 
field_name 	;	field_type(string,int,json); 		mandatory (Y/N)    [ ; enum1/enum2/enum3]
*/
DItf.buildRules = function( in_template ){
    let checker = {};
    // read line by line, and build
    //console.log("line : " + line);
    in_template.split("\n").forEach( line =>{
        let attrs = line.split(";");
        if ( attrs.length < 3 ){
            this.err(` Too few attrs  line '${line}'`);
            throw ERR.ServerException("Failed to buildTemplate for : " + line);
        }
        let field = attrs[0].trim();
        checker[field] = {};
        checker[ field ].type 		= attrs[1].trim();
        if (Object.keys(DItf.valid_types).indexOf(checker[ field ].type) == -1){
            this.err(" invalid type : " + line);
            throw "not a valid_type "+ checker[ field ].type;
        }
        checker[ field ].mandatory  = attrs[2].trim();

        // Map enum list as array
        if ( checker[ field ].type =="enum" ){
            attrs[3].split("/").forEach( e => {
                if (checker[ field ].enum === undefined) {checker[ field ].enum = []}
                checker[ field ].enum.push(e.trim());
            });
        }
    });
    //console.log("CHECK RULES FORMATED : " + JSON.stringify(checker));
    return checker;
}

//-----------------------------------------------
DItf.inputFilter = function ( in_rules, inputs ){
    this.dbg( "unfilter  : " + JSON.stringify(inputs) );
    let filtered_inputs = {};
    Object.keys(inputs).forEach(key =>{
        if (in_rules[key] !== undefined){
            filtered_inputs[key] = inputs[key];
        }
    });
    this.dbg( "filtered  : " + JSON.stringify(inputs) );
    return filtered_inputs;
}

//-----------------------------------------------
DItf.inputChecker = function( in_rules, inputs ){
    let check_ok = true;
    let nb_items_ok = 0;
    let invalid_attrs = [];
    let _this = this;
    try{
        // Foreach input item, check type
        Object.keys(inputs).forEach(key =>{
            let val = inputs[key];
            //console.log( "Checking " + key +" = "+val+" rule is : " + JSON.stringify(in_rules[key]) );
            if (! _this.valid_types[in_rules[key].type]( inputs,key,in_rules[key] ) ){
                this.warn( "Check KO (type) on field : " + key +", val=" + val);
                invalid_attrs.push(key);
                check_ok = false;
                return false;
            } else {
                nb_items_ok++;
            }
        });

        // Then check if a mandatory field is absent
        Object.keys(in_rules).forEach( field => {
            if (
                (in_rules[field].mandatory == "Y") && 
                (inputs[field] === undefined) ){
                    this.warn( "Mandatory attribute " + field + " not found." );
                    invalid_attrs.push(field);
                    check_ok = false;
                    return false;
                }
        });
    } catch (e) { 
        this.warn( "Failed to perform check...." + e);
        check_ok = false;
    }
    if (!check_ok) {
        throw new DitfError(DITF_ERROR.CHECK_FAILED, invalid_attrs);
    }

    // at least one parameter expected ?
    if ( ! nb_items_ok ) {
        this.warn( "No Data Provided");
        throw new DitfError(DITF_ERROR.NO_DATA);
    }
    return check_ok;
}



module.exports = DItf