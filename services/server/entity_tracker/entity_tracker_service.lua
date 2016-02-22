-- Service for the tracking entities, even after they are destroyed

EntityTrackerService = class()

local track_entities = radiant.util.get_config('track_entities', false)

function EntityTrackerService:initialize()
   self._sv = self.__saved_variables:get_data()

   if not self._sv._initialized then
      self._sv._initialized = true
      self._sv.entities = {}
      self._sv.out_of_bounds_entities = {}
   end

   self._entity_parents = {}
   
   if track_entities then
      self._all_entities = {}
      -- listen for every entity creation event so we can tear them all down between tests
      radiant.events.listen(radiant, 'radiant:entity:post_create', function(e)
            local entity = e.entity
            local id = entity:get_id()
            self._all_entities[id] = tostring(entity)
         end)
   end

   radiant.events.listen(radiant, 'radiant:mob:parent_changed', function(e)
         local entity = e.entity
         if entity and entity:is_valid() then
            local id = entity:get_id()
            local player_id = radiant.entities.get_player_id(entity)
            local parent = radiant.entities.get_parent(entity)
            if parent == nil and self._entity_parents[id] ~= nil then
               -- parent changed to nil. why?
               local inventory = stonehearth.inventory:get_inventory(player_id)
               if inventory and inventory:contains_item(entity) then
                  local container = inventory:container_for(entity)
                  if not container then
                     radiant.verify(false, "Entity %s is not in world and not in any storage container. Last parent was %s", entity, self._entity_parents[id])
                  end
               end
            else
               self._entity_parents[id] = parent
            end
         end
      end)
end

function EntityTrackerService:get_entity_info_command(session, response, id)
   if not track_entities then
      return 'Entity tracker is not enabled. Set mods.debugtools.track_entities=true'
   end
   return self._all_entities[id]
end

local function _is_in_bounds_point(point)
   local MIN = -2048
   local MAX = 2048
   if point.x > MAX or point.x < MIN then
      return false
   end

   if point.z > MAX or point.z < MIN then
      return false
   end

   if point.y > 200 or point.y < -10 then
      return false
   end

   return true
end

function EntityTrackerService:load_entities_command(session, response)
   local all_entities = _radiant.sim.get_all_entities()
   self._sv.entities = {}
   self._sv.out_of_bounds_entities = {}
   local count = 0
   if all_entities then
      for id, entity in pairs(all_entities) do
         local uri = entity:get_uri()
         local info = self._sv.entities[uri]
         if not info then
            local save_variables = radiant.create_datastore()
            save_variables:get_data().entities = {}
            info = {
               count = 0,
               data = save_variables
            }

            self._sv.entities[uri] = info
         end
         local entities_table = info.data:get_data().entities
         table.insert(entities_table, entity)
         info.count = info.count + 1
         count = count + 1

         local pos = radiant.entities.get_world_grid_location(entity)
         if pos then
            if not _is_in_bounds_point(pos) then
               table.insert(self._sv.out_of_bounds_entities, entity)
            end
         end
      end
   end
   self.__saved_variables:mark_changed()
   response:resolve({
      num_entities = count,
      tracker = self
      })
end

return EntityTrackerService