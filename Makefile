deploy:
	echo "deploy"
	rsync -avz -e ssh --exclude=.git --timeout=60 . linode:/var/www/registry.wannajs.org/ 
	ssh linode "cd /var/www/registry.wannajs.org &&  forever stop app.js && NODE_ENV=production forever start app.js"
