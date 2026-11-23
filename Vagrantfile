Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.box_version = "20241002.0.0"

  # Configure the hostname
  config.vm.hostname = "ubuntu-jammy"
  
   # IP privée fixe : app accessible sur http://192.168.56.10:5111
  config.vm.network "private_network", ip: "192.168.56.10"

  # Port 5111 exposé vers le host (0.0.0.0 = accessible depuis le réseau local)
  config.vm.network "forwarded_port", guest: 5111, host: 5111, host_ip: "0.0.0.0", auto_correct: false

  #configuration du provider virtualbox
  config.vm.provider "virtualbox" do |vb|
    vb.name = "ubuntu-jammy"
    vb.memory = "2048"
    vb.cpus = 2
  end
  
   # Installation de la todo-list (Node 22 + dockersamples/todo-list-app + service systemd)
  config.vm.provision "shell", path: "provision.sh"
  

end
