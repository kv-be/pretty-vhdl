# Pretty VHDL

VHDL Formatter for Visual Studio Code

## Usage

### Using Command Palette

- macOS: `CMD` + `SHIFT` + `P`
- Windows: `CTRL` + `SHIFT` + `P`

And type `Format Document`

### Keyboard Shortcuts

- macOS: `SHIFT` + `OPTION` + `F`
- Windows: `SHIFT` + `ALT` + `F`

If you don't like the defaults shortcuts, you can rebind `editor.action.formatDocument`in the keyboard shortcuts menu of VSCode.

## Disabling Pretty VHDL locally
It is impossible to support all kinds of possible scenarios which are possible. In case you are not satisfied with the alignment enforced by Pretty VHDL, you can use the magical comments below to disable the tool to a range of lines.
```vhdl
--autoformat_off

--autoformat_on
```

## Multiline support
### Declarations
Coding style hint: when a signal declaration becomes complex, consider using constants to simplify it.

```vhdl
signal a : std_logic_vector(C_VERY_LONG_CONSTRUCT
                            downto 
                            C_ANOTHER_VERY_LONG_CONSTRUCTION
                           ) := (

                           );

signal a : std_logic_vector(C_VERY_LONG_CONSTRUCT
                            downto 
                            C_ANOTHER_VERY_LONG_CONSTRUCTION);
```
### Default values
Pretty VHDL supports different coding styles to assign a default value to a constant, variable or signal.
Coding style hint: when a default value calculation is really complex, consider putting the calculation into a function.

The following conde shows how the allignment for default values works.
```vhdl
-- In the line below the default value assignment contains no opening bracket after the assignment symbol, so everything is alligned to the assignment symbol
constant C_CONSTANT : std_logic_vector := first_value and  
                                          second_value;

-- the line below contains an opening bracket after the assignment symbol without anything else, so the next lines get just one indent extra
constant C_CONSTANT : type_whatever := (
  first_value,
  second_value
);

-- the line below contains an opening bracket after the assignment symbol followed by the first part of the initial value, so the next lines are alligned to the first character of the first part of the initial value
constant C_CONSTANT : type_whatever := (first_value,
                                        second_value);
                                
constant C_CONSTANT : type_whatever := (first_value,
                                        second_value
                                       );
```
### Types
```vhdl
-- the line below contains no opening bracket after the assignment symbol, so everything is alligned to the assignment symbol
type t_enum is(one,
               two, 
               three);  

type t_enum is(one,
               two, 
               three
              );  

type t_enum is(
  one,
  two, 
  three
);  
                                
```


### Functions and procedures
For functions and procedures containing a lot of arguments, pretty VHDL forces the format shown in the code extract below. Please notice that the argument declarations expect each argument to be declared on one line. So multiline declarations of arguments of functions or procedures are not supported. Opening and closing brackets are forced to be as in the code snippet below.
```vhdl
function example(
  constant input1  : integer;
  constant input2  : boolean;
  constant output1 : std_logic_vector
) return integer;

procedure example(
  constant input1  : integer;
  constant input2  : boolean;
  constant output1 : std_logic_vector
) is
begin
...
end procedure;

```
### If ... elsif
The current implementation of Pretty VHDL supports multiline if statements with one level of multiline brackets. An example is given below.

```vhdl
if ( a < 5 and
     b > 7
   ) then 
...
end if;

if ( a < 5 and
     b > 7
   ) or
   (c = 9) then 
...
end if;
```
What is not supported is multiple levels of brackets spread over dfferent lines as in the example below. In such cases it is almost always better to use variables, constants or intermediate signals to simplify the if condition.
```vhdl
if ((a < 5 and
     b > 7
    ) or
    (
     a > 7 and
     b = 6
    )   
   ) or 
   (c = 9) then 
...
end if;

```
## Demo

![Demo](https://github.com/kv-be/pretty-vhdl/raw/main/resources/entity.gif)


VHDL pretty also provides Deltatec coding style compliant VHDL templates with the following shortcuts:

  | shortcut  | Description
  |-----------|--------------------------------------------------------|
  |  hdr      | inserts  the deltatec header                           |
  |  ent      | inserts standard libs and the entity declaration       |
  |  arch     | inserts the architecture template                      |
  |  enta     | same as ent and arch after each other                  |
  |  nf       | (new file): inserts a complete template for a VHDL file|
  |  cas      | inserts a case template                                |
  |  rec      | inserts a record template                              |
  |  forl     | inserts a for loop template                            |
  |  forg     | inserts a for generate template                        |
  |  if       | inserts an if template                                 |
  |  ifwe     | inserts an if - else template                          |
  |  ifg      | inserts an if - generate template                      |
  |  func     | inserts a function template                            |
  |  proc     | process template                                       |
  |  slv      | std_logic_vector                                       |
  |  uns      | unsigned                                               |
  |  var      | variable                                               |
  |  int      | integer                                                |
  |  dt       | downto                                                 |
  |  sig      | signal                                                 |
  |  pack     | complete package template  (with header)               |
  |  while    | while template                                         |
  |  pro      | a combinatorial process                                |
  |  spro     | a synchronous process                                  |
  |  o0       | (others => '0')                                        |
  |  o1       | (others => '1')                                        |
  

## Credits

[VHDL Formatter by vinrobot](https://marketplace.visualstudio.com/items?itemName=Vinrobot.vhdl-formatter)
