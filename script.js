const fs = require("fs");
const { exec } = require("child_process");
const crypto = require("crypto");

const exists = fs.existsSync("./pdf_output")
if (!exists) {
	exec("mkdir pdf_output")
}

const [templateFile, parametersFile, outputPrefix] = [process.argv[2], process.argv[3], process.argv[4]];
const content = fs.readFileSync(parametersFile, 'utf8').trim();
const lines = content.split("\n");
const texFile = fs.readFileSync(templateFile, 'utf8');

for (const line of lines) {
	const [param1, param2] = line.split(",").map(element => element.replaceAll('"', ''));
	const hash = crypto.createHash("md5").update(`${param1}_${param2}`).digest("hex").substring(0, 4);
	const newTexFile = texFile.replace("_PARAMETER1_", param1).replace("_PARAMETER2_", param2);
	const fileName = `${outputPrefix}_${param1}_${hash}.tex`.replace(" ", "_");
	fs.writeFileSync(fileName, newTexFile)
	exec(`pdflatex --output-directory=./pdf_output --synctex=1 --interaction=nonstopmode ${fileName}`, (err, stdout, stderr) => {
		if (err) {
			console.log(`could not compile tex: ${err}`);
			return;
		}
		console.log(`out: ${stdout}`);
		console.log(`err: ${stderr}`);
	}

	)
}

// wait until output files of pdflatex are written
const sleep = () => new Promise((resolve, reject) => {
	return setTimeout(resolve, 5000)
});


// unlink everything except pdf files
(async () => {

	await sleep();
	const files = fs.readdirSync("pdf_output");
	for (const file of files) {
		console.log(file.split(".")[file.split(".").length - 1]);
		if (file.split(".")[file.split(".").length - 1] != "pdf") {
			fs.unlink(`pdf_output/${file}`, err => {
				if (err) {
					console.log(err);
				}
				console.log(`unlinked ${file}`);
			}
			);
		}
	}
})();
