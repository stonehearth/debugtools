local Point3 = _radiant.csg.Point3
local InterruptAi = require 'mixintos.interrupt_ai.interrupt_ai'

local Commands = class()

function Commands:interrupt_ai(session, response, entity)
   stonehearth.ai:add_custom_action(entity, InterruptAi)
   radiant.events.listen(entity, 'debugtools:ai_interrupted', function()
         stonehearth.ai:remove_custom_action(entity, InterruptAi)
         return radiant.events.UNLISTEN
      end)
end

function Commands:create_and_place_entity(session, response, uri, iconic)
   local entity = radiant.entities.create_entity(uri)
   local entity_forms = entity:get_component('stonehearth:entity_forms')

   if iconic and entity_forms ~= nil then 
      entity = entity_forms:get_iconic_entity()
   end

   stonehearth.selection:select_location()
      :set_cursor_entity(entity)
      :done(function(selector, location, rotation)
            _radiant.call('debugtools:create_entity', uri, iconic, location, rotation)
               :done(function()
                  radiant.entities.destroy_entity(entity)
                  response:resolve(true)
               end)
         end)
      :fail(function(selector)
            selector:destroy()
            response:reject('no location')
         end)
      :always(function()
         end)
      :go()
end

function Commands:create_entity(session, response, uri, iconic, location, rotation)
   local entity = radiant.entities.create_entity(uri, { owner = session.player_id })
   local entity_forms = entity:get_component('stonehearth:entity_forms')

   if entity_forms == nil then
      iconic = false
   end

   radiant.terrain.place_entity(entity, location, { force_iconic = iconic })
   radiant.entities.turn_to(entity, rotation)
   local inventory = stonehearth.inventory:get_inventory(session.player_id)
   if inventory and not inventory:contains_item(entity) then
      inventory:add_item(entity)
   end
   
   return true
end

function Commands:add_exp_command(session, response, entity, exp)
   local job_component = entity:get_component('stonehearth:job')
   if not job_component then
      return false
   end
   job_component:add_exp(exp)
   return true
end

function Commands:set_attr_command(session, response, entity, attribute, value)
   local attribute_component = entity:get_component('stonehearth:attributes')
   if not attribute_component then
      return false
   end
   attribute_component:set_attribute(attribute, value)
   return true
end

function Commands:reset_location_command(session, response, entity, x, y, z)
   local location = radiant.entities.get_world_grid_location(entity)
   if x and y and z then
      location = Point3(x, y, z)
   end

   local placement_point = radiant.terrain.find_placement_point(location, 1, 4)
   radiant.terrain.place_entity(entity, placement_point)
   return true
end

function Commands:change_score_command(session, response, entity, scoreName, value)
   local score_component = entity:get_component('stonehearth:score')
   if not score_component then
      return false
   end
   if score_component:get_score(scoreName) == nil then
      return false
   end
   
   score_component:change_score(scoreName, value)
   return true
end

function Commands:reset_scores_command(session, response, entity)
   local score_component = entity:get_component('stonehearth:score')
   if not score_component then
      return false
   end   
   score_component:reset_all_scores()
   return true
end

function Commands:add_buff_command(session, response, entity, buff_uri)
   radiant.entities.add_buff(entity, buff_uri)
   return true
end

function Commands:remove_buff_command(session, response, entity, buff_name)
   if entity and entity:is_valid() then
      local buff_component = entity:get_component('stonehearth:buffs')
      if buff_component then
         buff_component:remove_buff(buff_name, true) -- True for removing all refs for the buff
         return true
      end
   end
   return false
end

function Commands:promote_to_command(session, response, entity, job)
   if not string.find(job, ':') and not string.find(job, '/') then
      -- as a convenience for autotest writers, stick the stonehearth:job on
      -- there if they didn't put it there to begin with
      job = 'stonehearth:jobs:' .. job
   end
   
   radiant.entities.drop_carrying_on_ground(entity)
   entity:get_component('stonehearth:job')
         :promote_to(job)
   return true
end

function Commands:add_citizen_command(session, response, entity, job)
   local player_id = session.player_id
   local pop = stonehearth.population:get_population(player_id)
   local citizen = pop:create_new_citizen()

   citizen:add_component('stonehearth:job')
               :promote_to('stonehearth:jobs:worker')

   local explored_region = stonehearth.terrain:get_visible_region(player_id):get()
   local centroid = _radiant.csg.get_region_centroid(explored_region):to_closest_int()
   local town_center = radiant.terrain.get_point_on_terrain(Point3(centroid.x, 0, centroid.y))

   local spawn_point = radiant.terrain.find_placement_point(town_center, 20, 30)
   radiant.terrain.place_entity(citizen, spawn_point)

   return true
end

function Commands:add_gold_console_command(session, response, gold_amount)
   local inventory = stonehearth.inventory:get_inventory(session.player_id)

   if inventory == nil then
      response:reject('there is no inventory for player ' .. session.player_id)
      return
   end

   if (gold_amount > 0) then
      -- give gold to the player
      inventory:add_gold(gold_amount)
   else
      -- deduct gold from the player
      gold_amount = -gold_amount;
      inventory:subtract_gold(gold_amount)
   end
   response:resolve({'added gold chests next to town banner'})
end

function Commands:dump_backpack_command(session, response, entity)
   local storage = entity:get_component('stonehearth:storage')

   if not storage then
      return false
   end

   storage:_on_kill_event()
   return true
end

function Commands:hot_reload_server(session, response, entity)
   radiant.resources.debug_clear_cached_json()
   return true
end

function Commands:hot_reload_client(session, response, entity)
   radiant.resources.debug_clear_cached_json()
   return true
end

function Commands:add_journal_command(session, response, entity, journalType)
   local journal_data = {entity = entity, description = journalType, probability_override = 100}
   stonehearth.personality:log_journal_entry(journal_data)
   response:resolve({})
end

function Commands:pasture_reproduce_command(session, response, entity)
   local pasture = entity:get_component('stonehearth:shepherd_pasture')

   if not pasture then
      return false
   end

   return pasture:_reproduce()
end

function Commands:renew_resource_command(session, response, entity)
   local renewable_resource_component = entity:get_component('stonehearth:renewable_resource_node')

   if not renewable_resource_component then
      return false
   end

   renewable_resource_component:renew()
   return true
end

function Commands:grow_command(session, response, entity)
   local evolve_component = entity:get_component('stonehearth:evolve')
   if evolve_component then
      evolve_component:evolve()
      return true
   end
   
   local growing_component = entity:get_component('stonehearth:growing')
   if growing_component then
      growing_component:_grow()
      return true
   end

   return false
end

return Commands