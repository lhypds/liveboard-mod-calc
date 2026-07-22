
liveboard-mod-calc
==================


Calculator [Liveboard](https://github.com/lhypds/liveboard) modules for Japan residents.

`RealEstateCalc`  
Japan real estate purchase calculator.  
Input property price, loan and fees, estimate the net value after X years.  

`StockCalc`  
Stock investment calculator.  
Input initial/monthly investment, estimate the remaining value after tax (NISA / taxable 20.315%).

`CurrencyCalc`  
Currency exchange calculator.  
Convert an amount across multiple currencies at once. Defaults to JPY / USD / CNY / AUD, more can be added.  
Rates come from [Frankfurter](https://frankfurter.dev) (ECB reference rates), no API key required.


Setup
-----

`board.config.json`  
Setup the repo URL.  

`modules.config.json`  
Modules config file, enable or disable modules, etc.  


modules.config.json
-------------------

Modules config file.  
key is the `ModuleName`, same as folder name.  


config.ts
---------

`config.ts` is in each module folder,  
It controls module default config template.  

Field `comp` is settings only used for that module.  
Fileds other than `comp` are common configs.  
