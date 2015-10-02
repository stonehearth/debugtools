debugtools = {
}

local service_creation_order = {
   'entity_tracker'
}

local function create_service(name)
   local path = string.format('debugtools.services.server.%s.%s_service', name, name)
   local service = require(path)()

   local saved_variables = debugtools._sv[name]
   if not saved_variables then
      saved_variables = radiant.create_datastore()
      debugtools._sv[name] = saved_variables
   end
   service.__saved_variables = saved_variables
   service._sv = saved_variables:get_data()
   saved_variables:set_controller(service)
   service:initialize()
   debugtools[name] = service
end

radiant.events.listen(debugtools, 'radiant:init', function()
      debugtools._sv = debugtools.__saved_variables:get_data()
      -- now create all the services
      for _, name in ipairs(service_creation_order) do
         create_service(name)
      end
   end)

return debugtools
