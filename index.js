const express 		= require('express');
const compression 	= require('compression');
const helmet 		= require('helmet');
const bodyParser 	= require('body-parser'); 	
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
 
const { GoogleAIFileManager } = require("@google/generative-ai/server"); 

const fs 			= require('fs');
const stream 		= require('stream'); 	

const process = {
	env:{	
		API_KEY:"AI**********",
		PORT:3000,
		MODEL: "gemini-1.5-pro"
	}	
};
  
const app = express();
const port = process.env.PORT; 
 
app.use(helmet());    
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json()); 
app.use(express.text());
app.use(function (req, res, next) {  
    res.setHeader('Access-Control-Allow-Origin', '*');    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');   
    res.setHeader('Access-Control-Allow-Headers', '*');   
    res.setHeader('Access-Control-Allow-Credentials', true);   
    next();
});
 
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}
 
app.post("/generate", async (req, res) => {
	try {		
		if(req.body.phrase!=''){
			const data = Object.assign({},req.body)
			var mimeType 		=  "";	
			var base64Data		=  "";  
			var filename		=  "";
			var filetype		=  "";
			var displayName 	=  "";
			if(data.filedata!=''){
				filetype 		=  data.ftype;
				filename	 	=  "test."+filetype;
				displayName 	=  "test file"; 				
				const imgdata 	=  data.filedata;  
				 
				if(filetype=='jpg' || filetype=='jpeg'){					
					base64Data = imgdata.replace(/^data:image\/jpeg;base64,/, "");
					mimeType = "image/jpeg";
				}else if(filetype=='png'){
					base64Data = imgdata.replace(/^data:image\/png;base64,/, "");
					mimeType = "image/png";
				}else if(filetype=='pdf'){
					base64Data = imgdata.replace(/^data:application\/pdf;base64,/, "");
					mimeType = "application/pdf";
				}else if(filetype=='doc'){					
					base64Data = imgdata.replace(/^data:application\/msword;base64,/, "");	
					mimeType = "application/msword";	
				}else if(filetype=='csv'){					
					base64Data = imgdata.replace(/^data:text\/csv;base64,/, "");
					mimeType = "text/csv";		
				}else if(filetype=='html'){	
					base64Data = imgdata.replace(/^data:text\/html;base64,/, "");
					mimeType = "text/html";	 
				}else if(filetype=='txt'){					
					base64Data = imgdata.replace(/^data:text\/plain;base64,/, "");
					mimeType = "text/plain";			
				}				 
				await fs.writeFileSync(filename, base64Data, 'base64', function(err){});				 
			}
			 
			if(data.phrase!=''){			 
				const prompt = data.phrase;
				const genAI = new GoogleGenerativeAI(process.env.API_KEY);
				const model = genAI.getGenerativeModel({ model: process.env.MODEL });
				
				 if(data.filedata!=''){						
					const fileManager = new GoogleAIFileManager(process.env.API_KEY);					 
					const imagePart = fileToGenerativePart(
					  filename,
					  mimeType
					);					
					const uploadResult = await fileManager.uploadFile(
					  filename,
					  {
						mimeType: mimeType,
						displayName: displayName,
					  }
					);	
					
					const getResponse = await fileManager.getFile(uploadResult.file.name);					
					console.log(`File Uploaded :: ${uploadResult.file.displayName}`);
					
					var result = await model.generateContentStream([prompt,imagePart]);
					
					await fileManager.deleteFile(uploadResult.file.name); 					
					console.log(`File Deleted :: ${uploadResult.file.displayName}`); 					
					
					if (fs.existsSync(filename)) {
					  fs.unlinkSync(filename);
					}					 
				 
				}else{
					var result = await model.generateContentStream(prompt); 
				}
				 
				var chunkdata= ""; 
				for await (const chunk of result.stream) {
				  var text = chunk.text();
				  chunkdata = chunkdata+text; 
				}				 
				res.send({ 
					qsn:"<h4>Query: "+prompt+"</h4>",
					response: chunkdata 
				});					
				 
			}else{
				res.status(404).json({ message: "No keyword given !"});
			}
			
		}else{
			res.status(404).json({ message: "No keyword given !"});
		}
		
	} catch (err) { 
		res.status(500).json(err);
	} 
	 
});


app.get("/", (req, res) => { 
  res.send("<html><body></body></html>");
});
 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
