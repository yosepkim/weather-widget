#!/bin/bash
locationKey=100
while IFS="," read -r city stateShort state postalCode
do
   city=`echo $city | tr -d '"'`
   stateShort=`echo $stateShort | tr -d '"'`
   state=`echo $state | tr -d '"'`
   postalCode=`echo $postalCode | tr -d '"'`

   echo ": $locationKey"
   echo "city: $city"
   echo "stateShort: $stateShort"
   echo "state: $state"
   echo "postalCode $postalCode"
   echo ""

   temp=`shuf -i 0-110 -n 1`

   f_value=`sed -e "s/#locationKey#/${locationKey}/g" \
       -e "s/#locationCity#/${city}/g" \
       -e "s/#locationStateShort#/${stateShort}/g" \
       -e "s/#locationState#/${state}/g" \
       -e "s/#postalCode#/${postalCode}/g" \
       -e "s/#tempUnit#/F/g" \
       -e "s/#temp#/${temp}/g" \
       -e 's/"/\"/g' \
       -e 's/\r\n/ /g' sample.html`

   temp=$((($temp-32)*5/9))

   c_value=`sed -e "s/#locationKey#/${locationKey}/g" \
       -e "s/#locationCity#/${city}/g" \
       -e "s/#locationStateShort#/${stateShort}/g" \
       -e "s/#locationState#/${state}/g" \
       -e "s/#postalCode#/${postalCode}/g" \
       -e "s/#tempUnit#/C/g" \
       -e "s/#temp#/${temp}/g" \
       -e 's/"/\"/g' \
       -e 's/\r\n/ /g' sample.html`

 
   akamai -accountkey 1-5BYUG1:1-8BYUX edgekv write text production weather-data 0 "${locationKey}-f" "$f_value"
   akamai -accountkey 1-5BYUG1:1-8BYUX edgekv write text production weather-data 0 "${locationKey}-c" "$c_value"

   locationKey=$((locationKey+1))
done < <(cut -d "," -f1,3,4,5 s_uscities.csv | tail -n +2)