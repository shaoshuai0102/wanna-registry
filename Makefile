deploy:
	echo "deploy"
	rsync -avz -e ssh --exclude=.git --timeout=60 . linode:/var/www/registry.wannjs.org/ 
	ssh linode "cd /var/www/registry.wannjs.org && forever restart app.js"
