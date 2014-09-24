/**
 * com.CapVentis.d3.utils
 * Routines to support use of d3 with Qlik Sense
 * @creator @owner Stephen Redmond
 * www.capventis.com 
 */


/// buildJSON
/// Takes a Qlik Sense data matrix and width info and
/// creates an array containing parent child information.
/// This array is then re-rendered into a JSON hierarchy
/// that can be used by d3 tree controls 
function buildJSON(qData, cubeWidth)
{
	// The array will hold our parent/child values
	var a=new Array();

	// This array will hold a list of IDs that we have already added to the other array.
	// We will use this make sure that we don't add duplicates
	var ids=new Array();
	
	$.each( qData, function ( key, value ) {
		
		// We loop across the columns to generate keys and parent/child rows
		for (j=0; j<cubeWidth-1; j++)
		{
			// The combination of the column number (j) and the element number (qElemNumber) is unique
			var key=(j) + '.' + value[j].qElemNumber;

			// Only bother with the rest if we haven't already processed this ID
			if(ids.indexOf(key)==-1)
			{
				ids.push(key);

				// If we are on column 0, the parent is '0', otherwise it is the previous column's ID
				var parent=j==0 ? '0' : (j-1) + '.' + value[j-1].qElemNumber;

				// create a JSON object to hold the values 
				var r={};
			
				r.Id = key;
				r.Parent = parent;
				r.depth = j+1;
				r.name = value[j].qText === '-' ? '<NULL>' : value[j].qText;
				
				// If j has reached the width over the cube, we can add the size value
				// This should be the last column in the cube - the measure 
				if(j==(cubeWidth-2))
				{
					if(value[cubeWidth-1].qNum === undefined)
						// remove the ',' from a formatted string - need to think about international!
						r.size=parseFloat(value[cubeWidth-1].qText.split(',').join(''),10);
					else
						r.size=value[cubeWidth-1].qNum;
				}

				// Add the JSON object to the array
				a.push(r);
			}
		}
	} );

	// Convert the array to a hierarchical JSON object and return it 
	var rval=convertToJSON(a);

	return rval;
}

/// convertToJSON
/// Takes an array of objects that contains an Id field, Parent field and a 
/// size field only at the leaf node, and returns a hierarchical "flare"
/// E.g.:
/*
	var arr = [{ "Id": "1", "name": "abc1", "Parent": "" },	
			   { "Id": "2", "name": "abc2", "Parent": "" },
               { "Id": "1.1", "name": "abc1.1", "Parent": "1" },
               { "Id": "1.2", "name": "abc1.2", "Parent": "1" },
               { "Id": "2.1", "name": "abc1.1", "Parent": "2" },
               { "Id": "2.2", "name": "abc1.2", "Parent": "2" },
               { "Id": "1.1.1", "name": "abc1.1.1", "Parent": "1.1", "size": 100 },
               { "Id": "1.1.2", "name": "abc1.1.2", "Parent": "1.1", "size": 101 },
               { "Id": "1.2.1", "name": "abc1.1.1", "Parent": "1.2", "size": 120 },
               { "Id": "1.2.2", "name": "abc1.1.1", "Parent": "1.2", "size": 109 },
               { "Id": "2.1.1", "name": "abc1.1.1", "Parent": "2.1", "size": 130 },
               { "Id": "2.2.1", "name": "abc", "Parent": "2.2", "size": 150 }];
*/
function convertToJSON(array){
    var map = {};
    for(var i = 0; i < array.length; i++){
        var obj = array[i];
		if(!obj.size)
			obj.children= [];

        map[obj.Id] = obj;

        var parent = obj.Parent || '0';
        if(!map[parent]){
            map[parent] = {
				name: "Universe",
				depth: 0,
				Id: "0",
				children: []
            };
        }
        map[parent].children.push(obj);
    }

    return map['0'];
}

